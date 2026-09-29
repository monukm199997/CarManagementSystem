from datetime import date, timedelta

def get_document_expiry_status(
    expiry_date,
    status="active"
):
  
    if status == "inactive":
        return "inactive"

    if not expiry_date:
        return "no_expiry"

    today = date.today()

    if expiry_date < today:
        return "expired"

    upcoming_date = today + timedelta(days=30)

    if expiry_date <= upcoming_date:
        return "expiring_soon"

    return "active"