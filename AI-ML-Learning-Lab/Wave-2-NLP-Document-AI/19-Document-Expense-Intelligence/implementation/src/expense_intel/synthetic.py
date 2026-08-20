from .schemas import DocumentInput
def fixtures():
    out=[]; vendors=["Acme Cafe","CloudBox","City Hotel","Office Mart"]
    for i in range(40):
        v=vendors[i%4]; cur="NGN" if i%2 else "USD"; subtotal=100+i; tax=10; total=subtotal+tax; txt=f"{v}\nDate: 2026-07-{(i%28)+1:02d}\nCurrency: {cur}\nSubtotal: {subtotal:.2f}\nTax: {tax:.2f}\nTotal: {total:.2f}\n"; out.append(DocumentInput(document_id=f"d{i}",vendor_template=v,raw_text=txt))
    return out
