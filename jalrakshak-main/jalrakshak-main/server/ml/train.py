"""
train.py  —  JalRakshak ML Model Training
==========================================
Trains a Multinomial Logistic Regression on synthetic CPCB-style
Brahmaputra Basin water quality data and exports weights to model.json.

Run:  python train.py
Requires: scikit-learn, numpy, pandas
"""

import json
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score

np.random.seed(42)

# ── 1. Generate synthetic training data ────────────────────────────────────────
#  Based on CPCB Brahmaputra Basin water quality reports (2018-2023)
#  and WHO drinking water guidelines.

N_PER_CLASS = 3120   # 4 classes × 3120 = 12,480 samples

def generate_class(n, ph_range, turb_range, cont_range, rain_range, noise=0.15):
    """Generate n samples for a risk class with Gaussian noise."""
    return pd.DataFrame({
        "ph":            np.clip(np.random.uniform(*ph_range,   n) + np.random.normal(0, noise, n), 4.0, 10.0),
        "turbidity":     np.clip(np.random.uniform(*turb_range, n) + np.random.normal(0, noise*20, n), 0, 200),
        "contamination": np.clip(np.random.uniform(*cont_range, n) + np.random.normal(0, noise*10, n), 0, 100),
        "rainfall":      np.clip(np.random.uniform(*rain_range, n) + np.random.normal(0, noise*30, n), 0, 400),
    })

low_df      = generate_class(N_PER_CLASS, (6.5, 8.0), (0,  20),  (0,  28),  (0,   65))
medium_df   = generate_class(N_PER_CLASS, (6.2, 8.3), (20, 52),  (25, 52),  (55, 105))
high_df     = generate_class(N_PER_CLASS, (5.9, 8.6), (48, 82),  (48, 78),  (95, 155))
critical_df = generate_class(N_PER_CLASS, (4.0, 6.2), (75, 200), (72, 100), (140, 400))

low_df["label"]      = 0
medium_df["label"]   = 1
high_df["label"]     = 2
critical_df["label"] = 3

df = pd.concat([low_df, medium_df, high_df, critical_df]).sample(frac=1, random_state=42).reset_index(drop=True)

# ── 2. Feature engineering ─────────────────────────────────────────────────────

df["ph_deviation_norm"]  = np.abs(df["ph"] - 7.0) / 2.0
df["turbidity_norm"]     = df["turbidity"] / 100.0
df["contamination_norm"] = df["contamination"] / 100.0
df["rainfall_norm"]      = df["rainfall"] / 200.0
df["cont_rain_interaction"] = df["contamination_norm"] * df["rainfall_norm"]

FEATURES = [
    "ph_deviation_norm",
    "turbidity_norm",
    "contamination_norm",
    "rainfall_norm",
    "cont_rain_interaction",
]

X = df[FEATURES].values
y = df["label"].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# ── 3. Train model ─────────────────────────────────────────────────────────────
model = LogisticRegression(
    multi_class="multinomial",
    solver="lbfgs",
    max_iter=500,
    C=1.0,           # regularization strength
    random_state=42,
)
model.fit(X_train, y_train)

train_acc = accuracy_score(y_train, model.predict(X_train))
test_acc  = accuracy_score(y_test,  model.predict(X_test))

print(f"Training accuracy:   {train_acc:.3f}")
print(f"Validation accuracy: {test_acc:.3f}")
print()
print(classification_report(y_test, model.predict(X_test), target_names=["LOW","MEDIUM","HIGH","CRITICAL"]))

# ── 4. Export weights ──────────────────────────────────────────────────────────
# Compute permutation feature importance
from sklearn.inspection import permutation_importance
perm = permutation_importance(model, X_test, y_test, n_repeats=10, random_state=42)
importances = dict(zip(FEATURES, (perm.importances_mean / perm.importances_mean.sum()).tolist()))

export = {
    "model_type": "MultinomialLogisticRegression",
    "version": "1.0.0",
    "trained_on": "CPCB_Brahmaputra_Basin_WQ_synthetic_2018-2023",
    "training_samples": len(X_train),
    "training_accuracy": round(train_acc, 4),
    "validation_accuracy": round(test_acc, 4),
    "feature_names": FEATURES,
    "feature_engineering": {
        "ph_deviation_norm":     "Math.abs(ph - 7.0) / 2.0",
        "turbidity_norm":        "turbidity / 100",
        "contamination_norm":    "contamination / 100",
        "rainfall_norm":         "rainfall / 200",
        "cont_rain_interaction": "(contamination / 100) * (rainfall / 200)",
    },
    "classes":      ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    "intercepts":   model.intercept_.tolist(),
    "coefficients": model.coef_.tolist(),
    "feature_importances": importances,
    "thresholds": {
        "ph_safe_min": 6.5, "ph_safe_max": 8.5,
        "turbidity_safe_ntu": 25, "contamination_safe_pct": 30, "rainfall_high_mm": 100,
    },
}

with open("model.json", "w") as f:
    json.dump(export, f, indent=2)
print("✅  Weights written to model.json")
