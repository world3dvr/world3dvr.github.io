import tkinter as tk
from tkinter import messagebox, ttk
import random
import threading
import time

# Global variables to share between apps
selected_ip = None
generated_password = None

# Server name parts
ServerPart1 = [
    'Ubuntu', 'LocalHost', 'NodeJS Server', 'EtherNet',
    'Kali', 'ArchLinux', 'ApacheServer', 'DockerHost', 'MegaNet', 'BitMiner'
]

# Generate random servers (name + port)
def generate_random_servers(count=5):
    servers = []
    for _ in range(count):
        name = random.choice(ServerPart1)
        port = random.randint(1000, 9000)
        servers.append(f"{name} {port}")
    return servers

# Generate random IP address
def generate_random_ip():
    return ".".join(str(random.randint(0, 255)) for _ in range(4))

# Generate random password
def generate_password(length=8):
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    return "".join(random.choice(chars) for _ in range(length))


# --- Server Finder Window ---
def open_server_finder():
    global selected_ip

    sf = tk.Toplevel(root)
    sf.title("Ichaea ServerFind")
    sf.geometry("500x400")
    sf.configure(bg="#1e1e1e")

    label = tk.Label(sf, text="ServerFind Tool (Unlicensed)", font=("Helvetica", 14, "bold"),
                     bg="#1e1e1e", fg="orange")
    label.pack(pady=10)

    listbox = tk.Listbox(sf, font=("Courier", 11), bg="#121212", fg="red", height=10)
    servers = generate_random_servers()
    for idx, server in enumerate(servers, 1):
        listbox.insert(idx, server)
    listbox.pack(padx=20, pady=10, fill="both", expand=True)

    ip_label = tk.Label(sf, text="Selected Server IP: None", bg="#1e1e1e", fg="white", font=("Helvetica", 10))
    ip_label.pack(pady=5)

    def on_select(event):
        global selected_ip
        try:
            index = listbox.curselection()[0]
            server = listbox.get(index)
            selected_ip = generate_random_ip()
            ip_label.config(text=f"Selected Server IP: {selected_ip}")
        except IndexError:
            pass

    listbox.bind("<<ListboxSelect>>", on_select)


# --- Doorkicker Window ---
def open_doorkicker():
    global selected_ip, generated_password

    dk = tk.Toplevel(root)
    dk.title("Doorkicker")
    dk.geometry("400x300")
    dk.configure(bg="#1e1e1e")

    label = tk.Label(dk, text="Doorkicker - Enter Server IP to breach", font=("Helvetica", 12, "bold"),
                     bg="#1e1e1e", fg="orange")
    label.pack(pady=10)

    ip_entry = tk.Entry(dk, font=("Courier", 14), width=20)
    ip_entry.pack(pady=10)

    status_label = tk.Label(dk, text="", bg="#1e1e1e", fg="lime", font=("Helvetica", 11))
    status_label.pack(pady=10)

    progress = ttk.Progressbar(dk, orient="horizontal", length=300, mode="determinate")
    progress.pack(pady=10)

    def breach():
        nonlocal progress, status_label, ip_entry
        entered_ip = ip_entry.get().strip()
        if selected_ip is None:
            messagebox.showerror("Error", "No server selected in Server Finder.")
            return
        if entered_ip != selected_ip:
            messagebox.showerror("Error", "IP does not match the selected server.")
            return

        # Reset progress bar and status
        progress['value'] = 0
        status_label.config(text="Breaching... Please wait.")
        dk.update_idletasks()

        def run_progress():
            nonlocal progress, status_label, dk
            for i in range(101):
                time.sleep(random.uniform(0.04, 0.1))  # ~4 to 10 seconds total
                progress['value'] = i
                dk.update_idletasks()
            # After progress complete
            global generated_password
            generated_password = generate_password()
            status_label.config(text=f"Breach successful! Password: {generated_password}")

        threading.Thread(target=run_progress, daemon=True).start()

    breach_btn = tk.Button(dk, text="Start Breach", command=breach, bg="darkgreen", fg="white", font=("Helvetica", 12))
    breach_btn.pack(pady=10)


# --- Miner Window ---
def open_miner():
    global generated_password

    miner = tk.Toplevel(root)
    miner.title("Bitcoin Miner")
    miner.geometry("400x350")
    miner.configure(bg="#1e1e1e")

    label = tk.Label(miner, text="Bitcoin Miner", font=("Helvetica", 16, "bold"), bg="#1e1e1e", fg="cyan")
    label.pack(pady=15)

    pw_label = tk.Label(miner, text="Enter Server Password:", font=("Helvetica", 12), bg="#1e1e1e", fg="white")
    pw_label.pack(pady=5)

    pw_entry = tk.Entry(miner, font=("Courier", 14), width=20, show="*")
    pw_entry.pack(pady=5)

    status_label = tk.Label(miner, text="", bg="#1e1e1e", fg="lime", font=("Helvetica", 12))
    status_label.pack(pady=10)

    progress = ttk.Progressbar(miner, orient="horizontal", length=300, mode="determinate")
    progress.pack(pady=10)

    def start_mining():
        entered_pw = pw_entry.get().strip()
        if generated_password is None:
            messagebox.showerror("Error", "No password generated from Doorkicker.")
            return
        if entered_pw != generated_password:
            messagebox.showerror("Error", "Incorrect password!")
            return

        progress['value'] = 0
        status_label.config(text="Mining started...")
        miner.update_idletasks()

        def run_mining():
            nonlocal progress, status_label, miner
            for i in range(101):
                time.sleep(0.05)  # ~5 seconds total
                progress['value'] = i
                miner.update_idletasks()
            status_label.config(text="Mining complete! Rewards deposited.")

        threading.Thread(target=run_mining, daemon=True).start()

    start_btn = tk.Button(miner, text="Start Mining", command=start_mining, bg="darkblue", fg="white", font=("Helvetica", 12))
    start_btn.pack(pady=15)


# --- Main Launcher Window ---
root = tk.Tk()
root.title("Ichaea Launcher (Unlicensed)")
root.geometry("640x480")
root.configure(bg="#1e1e1e")

header = tk.Label(root, text="Ichaea Launcher", font=("Helvetica", 20, "bold"), fg="cyan", bg="#1e1e1e")
header.pack(pady=10)

disclaimer = tk.Label(
    root,
    text="Use this launcher responsibly. Mining or scanning third-party systems is prohibited.",
    font=("Helvetica", 9),
    fg="gray",
    bg="#1e1e1e"
)
disclaimer.pack()

menu_frame = tk.Frame(root, bg="#2a2a2a", bd=2, relief="groove")
menu_frame.pack(pady=40, padx=20, fill="both", expand=True)

menu_label = tk.Label(menu_frame, text="App Launch Menu", font=("Helvetica", 14, "bold"), fg="white", bg="#2a2a2a")
menu_label.pack(pady=10)

app_buttons = [
    ("Launch Server Finder", open_server_finder, "darkgreen"),
    ("Open Doorkicker", open_doorkicker, "#8844aa"),
    ("Open Miner", open_miner, "#666666"),
    ("Exit", root.quit, "darkred"),
]

for text, command, color in app_buttons:
    btn = tk.Button(menu_frame, text=text, command=command, font=("Helvetica", 12), bg=color, fg="white", padx=10, pady=5)
    btn.pack(pady=5, fill="x", padx=50)

root.mainloop()
