from twilio.rest import Client

account_sid = "ACb78fffecbe5cb21760af9db4b6cc1f32"
auth_token = "55aa666b5f0af59c77fc898d442308e5"

try:
    client = Client(account_sid, auth_token)
    incoming_phone_numbers = client.incoming_phone_numbers.list(limit=5)
    print("FOUND_NUMBERS:")
    for record in incoming_phone_numbers:
        print(f"PHONE: {record.phone_number} ({record.friendly_name})")
    if not incoming_phone_numbers:
        print("NO_PHONE_NUMBERS_FOUND")
except Exception as e:
    print(f"ERROR: {e}")
