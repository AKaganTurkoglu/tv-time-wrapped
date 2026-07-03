import os
import csv

data_dir = "tv_time_exported_data"

def read_csv_to_dicts(filepath):
    if not os.path.exists(filepath):
        return []
    with open(filepath, mode='r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        return list(reader)

polls = read_csv_to_dicts(os.path.join(data_dir, "user_poll.csv"))
print(f"Total polls voted on: {len(polls)}")

friends = read_csv_to_dicts(os.path.join(data_dir, "friend.csv"))
print(f"Total friends: {len(friends)}")

connections = read_csv_to_dicts(os.path.join(data_dir, "user_connection.csv"))
print(f"Total connection logs (app sessions/launches?): {len(connections)}")
if connections:
    # Let's count sessions by year
    years = {}
    for c in connections:
        date_str = c.get('created_at') or c.get('updated_at')
        if date_str:
            year = date_str.split('-')[0]
            years[year] = years.get(year, 0) + 1
    print("Sessions by year:", sorted(years.items()))
