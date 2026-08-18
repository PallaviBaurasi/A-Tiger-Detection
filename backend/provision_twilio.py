from twilio.rest import Client

account_sid = "ACb78fffecbe5cb21760af9db4b6cc1f32"
auth_token = "55aa666b5f0af59c77fc898d442308e5"

client = Client(account_sid, auth_token)

# Check caller IDs
try:
    caller_ids = client.outgoing_caller_ids.list()
    print("VERIFIED CALLER IDS:")
    for cid in caller_ids:
        print(f"  {cid.phone_number} ({cid.friendly_name})")
except Exception as e:
    print(f"Caller IDs error: {e}")

# Check if we can search & buy a free number on trial
try:
    available = client.available_phone_numbers('US').local.list(limit=1)
    if available:
        num = available[0].phone_number
        print(f"AVAILABLE US NUMBER: {num}")
        # Try to buy (free with trial balance)
        bought = client.incoming_phone_numbers.create(phone_number=num)
        print(f"SUCCESSFULLY PROVISIONED TWILIO NUMBER: {bought.phone_number}")
except Exception as e:
    print(f"Provisioning error: {e}")
