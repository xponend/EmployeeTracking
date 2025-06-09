import sys
import json
import mysql.connector
import time
import os
from datetime import date

# Database connection
connectiondb = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="employeetracking",
    port=3306,
)
cursordb = connectiondb.cursor()
print("DB CONNECTION DESTROY", connectiondb)


def show_activity():
    """
    Read activities from JSON file and return activity data
    """
    b = list()  # activity names
    d = list()  # activity durations

    try:
        with open("activities.json", "r") as jsonfile:
            a = json.load(jsonfile)
            e = a["activities"]
            print(f"Found {len(e)} activities in activities.json")
    except FileNotFoundError:
        print("No activities.json file found")
        return []
    except json.JSONDecodeError:
        print("Error reading activities.json - invalid JSON")
        return []
    except Exception as ex:
        print(f"Error reading activities.json: {ex}")
        return []

    # Extract activity names
    for i in e:
        b.append(i["name"])

    tot = 0

    # Calculate total time for each activity
    for i in e:
        sed = 0
        for j in i["time_entries"]:
            try:
                # Convert time to seconds
                minutes = int(j.get("minutes", 0))
                seconds = int(j.get("seconds", 0))
                hours = int(j.get("hours", 0))

                sed = sed + minutes * 60 + seconds + hours * 3600
                tot = tot + sed
            except (ValueError, KeyError) as ex:
                print(f"Error processing time entry: {ex}")
                continue
        d.append(sed)

    # Convert to human readable total time
    kek = time.strftime("%H:%M:%S", time.gmtime(tot))
    kek = "Time used : " + kek
    print(f"Total activities: {b}")
    print(f"Activity durations (seconds): {d}")
    print(kek)

    # Combine names and durations
    combineBD = zip(b, d)
    zipped_list = list(combineBD)

    return zipped_list


def cleanup_monitoring_processes():
    """
    Clean up any running monitoring processes
    """
    try:
        print("Cleaning up monitoring processes...")

        # Kill any remaining monitoring processes
        os.system("pkill -f 'initApp.py'")
        os.system("pkill -f 'python.*initApp'")

        print("Monitoring processes cleaned up")
        return True

    except Exception as e:
        print(f"Error cleaning up processes: {e}")
        return False


def save_monitoring_details(e_id, o_id):
    """
    Save monitoring details to database
    """
    try:
        activities = show_activity()

        if not activities:
            print("No activities to save")
            return 0

        today = date.today()
        records_inserted = 0

        for activity_name, total_seconds in activities:
            try:
                # Skip empty or very short activities
                if not activity_name or total_seconds < 1:
                    continue

                # Clean up activity name (truncate if too long)
                clean_name = str(activity_name)[:500]  # Limit to 500 chars

                sql = "INSERT INTO MonitoringDetails (md_title, md_total_time_seconds, md_date, e_id_id, o_id_id) VALUES (%s, %s, %s, %s, %s)"
                val = (clean_name, total_seconds, today, e_id, o_id)

                cursordb.execute(sql, val)
                connectiondb.commit()
                records_inserted += 1

                print(f"Saved: {clean_name} - {total_seconds} seconds")

            except mysql.connector.Error as db_err:
                print(f"Database error saving activity '{activity_name}': {db_err}")
                continue
            except Exception as ex:
                print(f"Error saving activity '{activity_name}': {ex}")
                continue

        print(f"{records_inserted} records inserted into MonitoringDetails")
        return records_inserted

    except Exception as e:
        print(f"Error in save_monitoring_details: {e}")
        return 0


def create_monitoring_details_table():
    """
    Create MonitoringDetails table if it doesn't exist
    """
    try:
        sql = """
        CREATE TABLE IF NOT EXISTS MonitoringDetails (
            id INT AUTO_INCREMENT PRIMARY KEY,
            md_title VARCHAR(500),
            md_total_time_seconds INT,
            md_date DATE,
            e_id_id VARCHAR(50),
            o_id_id VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        cursordb.execute(sql)
        connectiondb.commit()
        print("MonitoringDetails table checked/created")
        return True
    except Exception as e:
        print(f"Error creating MonitoringDetails table: {e}")
        return False


def main():
    """
    Main function for destroyApp
    """
    try:
        # Parse command line arguments
        if len(sys.argv) > 1:
            json_object = json.loads(sys.argv[1])
            e_id = json_object["e_id"]
            o_id = json_object["o_id"]

            print(f"Destroying monitoring for e_id: {e_id}, o_id: {o_id}")
        else:
            print("No arguments provided, using default values")
            e_id = "default_user"
            o_id = "default_org"

        # Ensure table exists
        create_monitoring_details_table()

        # Clean up processes first
        cleanup_monitoring_processes()

        # Wait a moment for processes to terminate
        time.sleep(2)

        # Save activity data to database
        records_saved = save_monitoring_details(e_id, o_id)

        # Clean up JSON file after saving (optional)
        try:
            if os.path.exists("activities.json") and records_saved > 0:
                # Backup the file instead of deleting
                backup_name = f"activities_backup_{int(time.time())}.json"
                os.rename("activities.json", backup_name)
                print(f"Activities backed up to {backup_name}")
        except Exception as e:
            print(f"Error backing up activities.json: {e}")

        print("Monitoring destroy completed successfully")

    except json.JSONDecodeError as json_err:
        print(f"JSON decode error: {json_err}")
    except mysql.connector.Error as db_err:
        print(f"Database error: {db_err}")
    except Exception as e:
        print(f"General error in main: {e}")
    finally:
        # Always close database connection
        try:
            if cursordb:
                cursordb.close()
            if connectiondb:
                connectiondb.close()
            print("Database connection closed")
        except:
            pass


if __name__ == "__main__":
    main()
