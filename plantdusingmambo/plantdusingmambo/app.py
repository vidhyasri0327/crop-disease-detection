import os
import json
import time
from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_from_directory
from werkzeug.utils import secure_filename
from core.engine import MambaInference
from core.translator import translate_dict

app = Flask(__name__)
app.secret_key = 'supersecretmambakey'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['USERS_FILE'] = 'users.json'
app.config['HISTORY_FILE'] = 'history.json'
app.config['ORDERS_FILE'] = 'orders.json'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def load_users():
    if os.path.exists(app.config['USERS_FILE']):
        with open(app.config['USERS_FILE'], 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(app.config['USERS_FILE'], 'w') as f:
        json.dump(users, f)

def load_history():
    if os.path.exists(app.config['HISTORY_FILE']):
        with open(app.config['HISTORY_FILE'], 'r') as f:
            return json.load(f)
    return []

def save_history(history):
    with open(app.config['HISTORY_FILE'], 'w') as f:
        json.dump(history, f)

def load_orders():
    if os.path.exists(app.config['ORDERS_FILE']):
        with open(app.config['ORDERS_FILE'], 'r') as f:
            return json.load(f)
    return []

def save_orders(orders):
    with open(app.config['ORDERS_FILE'], 'w') as f:
        json.dump(orders, f, indent=2)

def load_feedback():
    if os.path.exists('feedback.json'):
        with open('feedback.json', 'r') as f:
            return json.load(f)
    return []

def save_feedback(feedback):
    with open('feedback.json', 'w') as f:
        json.dump(feedback, f, indent=2)

model = MambaInference()

@app.route('/')
def index():
    return render_template('landing.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        u = request.form.get('username')
        p = request.form.get('password')
        users = load_users()
        if u in users and users[u] == p:
            session['user'] = u
            return redirect(url_for('dashboard'))
        return render_template('auth.html', mode='login', error="Invalid Credentials")
    return render_template('auth.html', mode='login')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        u = request.form.get('username')
        p = request.form.get('password')
        cp = request.form.get('confirm_password')
        if not u or not p:
            return render_template('auth.html', mode='signup', error="All fields required")
        if p != cp:
            return render_template('auth.html', mode='signup', error="Passwords do not match")
        users = load_users()
        if u in users:
            return render_template('auth.html', mode='signup', error="User already exists")
        users[u] = p
        save_users(users)
        session['user'] = u
        return redirect(url_for('dashboard'))
    return render_template('auth.html', mode='signup')

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    if 'user' not in session: return redirect(url_for('login'))
    return render_template('home.html', user=session['user'])

@app.route('/history')
def history():
    if 'user' not in session: return redirect(url_for('login'))
    return render_template('history.html', user=session['user'])

@app.route('/orders')
def orders_page():
    if 'user' not in session: return redirect(url_for('login'))
    return render_template('orders.html', user=session['user'])

@app.route('/api/history')
def api_history():
    if 'user' not in session: return jsonify([])
    h = load_history()
    user_h = [x for x in h if x.get('user') == session['user']]
    return jsonify(user_h[-20:][::-1])

@app.route('/api/orders', methods=['GET', 'POST'])
def api_orders():
    if request.method == 'POST':
        data = request.get_json()
        if 'user' in session:
            data['user'] = session['user']
        orders = load_orders()
        orders.append(data)
        save_orders(orders)
        return jsonify({"success": True, "order_id": data.get('id')})
    else:
        if 'user' not in session: return jsonify([])
        orders = load_orders()
        user_orders = [o for o in orders if o.get('user') == session['user']]
        return jsonify(user_orders[::-1])

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'file' not in request.files: return jsonify({"error": "No file"}), 400
    f = request.files['file']
    if f.filename == '': return jsonify({"error": "No file"}), 400
    
    ts = int(time.time() * 1000)
    fname = f"{ts}_{secure_filename(f.filename)}"
    fp = os.path.join(app.config['UPLOAD_FOLDER'], fname)
    f.save(fp)
    lang = request.form.get('lang', 'en')
    print(f"[DEBUG] Received lang: {lang}")
    
    try:
        data = model.forward(fp, lang)
        data['image'] = fname
        data['timestamp'] = ts
        
        if 'user' in session:
            h = load_history()
            h.append({**data, 'user': session['user']})
            save_history(h)
        
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/set-lang/<lang>')
def set_lang(lang):
    session['lang'] = lang if lang in ['en', 'ta'] else 'en'
    return jsonify({"lang": session['lang']})

@app.route('/api/get-lang')
def get_lang():
    return jsonify({"lang": session.get('lang', 'en')})

@app.route('/api/feedback', methods=['POST'])
def api_feedback():
    data = request.get_json()
    if 'user' in session:
        data['user'] = session['user']
    fb = load_feedback()
    fb.append(data)
    save_feedback(fb)
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
