from __future__ import print_function
import time
import json
import datetime
import sys
import mysql.connector
import subprocess
import re
from urllib.parse import urlparse

# macOS specific imports
try:
    from AppKit import NSWorkspace
    import Quartz
    MACOS_AVAILABLE = True
except ImportError:
    print("AppKit not available, installing...")
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'pyobjc-framework-Cocoa'])
    try:
        from AppKit import NSWorkspace
        import Quartz
        MACOS_AVAILABLE = True
    except ImportError:
        MACOS_AVAILABLE = False
        print("Failed to import macOS frameworks")

connectiondb = mysql.connector.connect(
    host="localhost", user="root", password="", database="employeetracking", port=3306
)
cursordb = connectiondb.cursor()

print("MONITORING - macOS Version")
print(connectiondb)


class AcitivyList:
    def __init__(self, activities):
        self.activities = activities

    def initialize_me(self):
        activity_list = AcitivyList([])
        try:
            with open("activities.json", "r") as f:
                data = json.load(f)
                activity_list = AcitivyList(activities=self.get_activities_from_json(data))
        except FileNotFoundError:
            print("activities.json not found, creating new one")
            activity_list = AcitivyList([])
        return activity_list

    def get_activities_from_json(self, data):
        return_list = []
        for activity in data["activities"]:
            return_list.append(
                Activity(
                    name=activity["name"],
                    time_entries=self.get_time_entires_from_json(activity),
                )
            )
        self.activities = return_list
        return return_list

    def get_time_entires_from_json(self, data):
        return_list = []
        for entry in data["time_entries"]:
            try:
                from dateutil import parser
                return_list.append(
                    TimeEntry(
                        start_time=parser.parse(entry["start_time"]),
                        end_time=parser.parse(entry["end_time"]),
                        days=entry["days"],
                        hours=entry["hours"],
                        minutes=entry["minutes"],
                        seconds=entry["seconds"],
                    )
                )
            except ImportError:
                # Fallback if dateutil is not available
                pass
        return return_list

    def serialize(self):
        return {"activities": self.activities_to_json()}

    def activities_to_json(self):
        activities_ = []
        for activity in self.activities:
            activities_.append(activity.serialize())
        return activities_


class Activity:
    def __init__(self, name, time_entries):
        self.name = name
        self.time_entries = time_entries

    def serialize(self):
        return {"name": self.name, "time_entries": self.make_time_entires_to_json()}

    def make_time_entires_to_json(self):
        time_list = []
        for time in self.time_entries:
            time_list.append(time.serialize())
        return time_list


class TimeEntry:
    def __init__(self, start_time, end_time, days, hours, minutes, seconds):
        self.start_time = start_time
        self.end_time = end_time
        self.total_time = end_time - start_time
        self.days = days
        self.hours = hours
        self.minutes = minutes
        self.seconds = seconds

    def _get_specific_times(self):
        self.days, self.seconds = self.total_time.days, self.total_time.seconds
        self.hours = self.days * 24 + self.seconds // 3600
        self.minutes = (self.seconds % 3600) // 60
        self.seconds = self.seconds % 60

    def serialize(self):
        return {
            "start_time": self.start_time.strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": self.end_time.strftime("%Y-%m-%d %H:%M:%S"),
            "days": self.days,
            "hours": self.hours,
            "minutes": self.minutes,
            "seconds": self.seconds,
        }


def get_active_window_macos():
    """Get the active window name on macOS"""
    try:
        if MACOS_AVAILABLE:
            # Get the active application
            workspace = NSWorkspace.sharedWorkspace()
            active_app = workspace.activeApplication()
            if active_app:
                app_name = active_app['NSApplicationName']
                
                # Try to get window title using AppleScript
                try:
                    script = '''
                    tell application "System Events"
                        set frontApp to name of first application process whose frontmost is true
                        if frontApp is not missing value then
                            tell application process frontApp
                                set frontWindow to name of front window
                                return frontWindow
                            end tell
                        end if
                    end tell
                    '''
                    result = subprocess.run(['osascript', '-e', script], 
                                          capture_output=True, text=True, timeout=5)
                    if result.returncode == 0 and result.stdout.strip():
                        window_title = result.stdout.strip()
                        return f"{app_name} - {window_title}"
                except Exception as e:
                    print(f"AppleScript error: {e}")
                
                return app_name
        else:
            # Fallback method using ps command
            result = subprocess.run(['ps', '-eo', 'pid,comm'], capture_output=True, text=True)
            # This is a basic fallback - you might want to improve this
            return "Unknown Application"
            
    except Exception as e:
        print(f"Error getting active window: {e}")
        return "Unknown"


def get_chrome_url_macos():
    """Get the current Chrome URL on macOS"""
    try:
        script = '''
        tell application "Google Chrome"
            if (count of windows) > 0 then
                set currentTab to active tab of front window
                return URL of currentTab
            end if
        end tell
        '''
        result = subprocess.run(['osascript', '-e', script], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception as e:
        print(f"Error getting Chrome URL: {e}")
    return None


def get_safari_url_macos():
    """Get the current Safari URL on macOS"""
    try:
        script = '''
        tell application "Safari"
            if (count of windows) > 0 then
                return URL of current tab of front window
            end if
        end tell
        '''
        result = subprocess.run(['osascript', '-e', script], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception as e:
        print(f"Error getting Safari URL: {e}")
    return None


def url_to_name(url):
    """Extract domain name from URL"""
    if url:
        try:
            parsed = urlparse(url)
            return parsed.netloc
        except:
            return url
    return "Unknown"


def get_active_window():
    """Get active window - macOS compatible"""
    return get_active_window_macos()


def get_browser_info():
    """Get browser URL if browser is active"""
    active_window = get_active_window()
    
    if "Google Chrome" in active_window or "Chrome" in active_window:
        url = get_chrome_url_macos()
        if url:
            return url_to_name(url)
    elif "Safari" in active_window:
        url = get_safari_url_macos()
        if url:
            return url_to_name(url)
    
    return active_window


def record(active_window_name, activity_name, start_time, activeList, first_time, e_id, o_id):
    """Main recording loop"""
    try:
        al = activeList.initialize_me()
    except Exception as e:
        print(f"Error initializing activity list: {e}")
        al = AcitivyList([])

    try:
        while True:
            # Get current active window/application
            new_window_name = get_browser_info()
            
            if active_window_name != new_window_name:
                print(f"Active window changed to: {new_window_name}")
                activity_name = active_window_name
                
                # Insert into database
                ct = datetime.datetime.now()
                sql = "INSERT INTO monitoring (m_title, m_log_ts, e_id_id, o_id_id) VALUES (%s, %s, %s, %s)"
                val = (new_window_name, ct, e_id, o_id)
                
                try:
                    cursordb.execute(sql, val)
                    connectiondb.commit()
                    print(f"{cursordb.rowcount} record inserted.")
                except mysql.connector.Error as err:
                    print(f"Database error: {err}")

                if not first_time:
                    end_time = datetime.datetime.now()
                    time_entry = TimeEntry(start_time, end_time, 0, 0, 0, 0)
                    time_entry._get_specific_times()

                    exists = False
                    for activity in activeList.activities:
                        if activity.name == activity_name:
                            exists = True
                            activity.time_entries.append(time_entry)

                    if not exists:
                        activity = Activity(activity_name, [time_entry])
                        activeList.activities.append(activity)
                    
                    try:
                        with open("activities.json", "w") as json_file:
                            json.dump(activeList.serialize(), json_file, indent=4, sort_keys=True)
                    except Exception as e:
                        print(f"Error writing activities.json: {e}")
                    
                    start_time = datetime.datetime.now()
                
                first_time = False
                active_window_name = new_window_name

            time.sleep(2)  # Check every 2 seconds

    except KeyboardInterrupt:
        print("Monitoring stopped by user")
        try:
            with open("activities.json", "w") as json_file:
                json.dump(activeList.serialize(), json_file, indent=4, sort_keys=True)
        except Exception as e:
            print(f"Error saving final activities.json: {e}")


def mainRecord(e_id, o_id):
    """Main entry point for recording"""
    print(f"Starting monitoring for employee {e_id}, organization {o_id}")
    active_window_name = str()
    activity_name = ""
    start_time = datetime.datetime.now()
    activeList = AcitivyList([])
    first_time = True
    
    record(active_window_name, activity_name, start_time, activeList, first_time, e_id, o_id)


# Test function
def test_monitoring():
    """Test function to check if monitoring works"""
    print("Testing macOS monitoring...")
    print(f"Active window: {get_active_window()}")
    print(f"Browser info: {get_browser_info()}")


if __name__ == "__main__":
    # For testing
    if len(sys.argv) > 1:
        try:
            json_data = json.loads(sys.argv[1])
            e_id = json_data.get('e_id')
            o_id = json_data.get('o_id')
            flag = json_data.get('flag')
            
            print(f"Received - e_id: {e_id}, o_id: {o_id}, flag: {flag}")
            
            if flag == '1':
                mainRecord(e_id, o_id)
            else:
                print("Monitoring stopped")
                
        except Exception as e:
            print(f"Error: {e}")
    else:
        test_monitoring()