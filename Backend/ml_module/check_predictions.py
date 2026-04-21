from db import get_db
from collections import defaultdict

db    = get_db()
preds = list(db["predictions"].find(
    {}, {"_id":0,"supplier_id":1,"material_name":1,"category":1,"condition":1,"parts":1,"predicted_quantity":1}
))

print(f"Total predictions: {len(preds)}\n")

by_mat = defaultdict(list)
for p in preds:
    by_mat[p["material_name"]].append(p)

for mat in sorted(by_mat):
    rows = by_mat[mat]
    print(f"--- {mat} ({len(rows)} variant(s)) ---")
    for r in sorted(rows, key=lambda x: x["supplier_id"]):
        print(f"  sup={r['supplier_id'][-8:]} | cat={str(r.get('category','')):<14}| cond={str(r.get('condition','')):<20}| parts={str(r.get('parts','')):<8}| qty={r['predicted_quantity']:.2f}")
    print()
