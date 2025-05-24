import requests

url = "http://data.phishtank.com/data/online-valid.json"
output_file = "verified_online.json"

response = requests.get(url)

if response.status_code == 200:
    with open(output_file, 'wb') as f:
        f.write(response.content)
    print(f"Downloaded PhishTank data to '{output_file}'")
else:
    print(f"Failed to download. Status code: {response.status_code}")
