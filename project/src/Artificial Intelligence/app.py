from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

protocol_counts = {"TCP": 0, "UDP": 0, "ICMP": 0}
anomaly_data = {"normal": 0, "abnormal": 0}
additional_metrics = {"duration": 0, "src_bytes": 0, "dst_bytes": 0}

@app.route('/upload', methods=['POST'])
def upload_file():
    global protocol_counts, anomaly_data, additional_metrics

    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join('uploads', filename)
    file.save(filepath)

    try:
        df = pd.read_csv(filepath)
        protocol_counts = count_protocol_types(df)
        anomaly_data = detect_anomalies(df)
        additional_metrics = calculate_additional_metrics(df)  # Calculate additional metrics
        return jsonify({'message': 'File uploaded successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

def calculate_additional_metrics(df):
    if 'duration' not in df.columns:
        df['duration'] = [0] * len(df)
    if 'src_bytes' not in df.columns:
        df['src_bytes'] = [0] * len(df)
    if 'dst_bytes' not in df.columns:
        df['dst_bytes'] = [0] * len(df)
    
    duration = df['duration'].head(10).tolist()
    src_bytes = df['src_bytes'].head(10).tolist()
    dst_bytes = df['dst_bytes'].head(10).tolist()

    return {"duration": duration, "src_bytes": src_bytes, "dst_bytes": dst_bytes}


@app.route('/get-predictions', methods=['GET'])
def get_predictions():
    global protocol_counts, anomaly_data, additional_metrics
    return jsonify({
        "protocol_counts": protocol_counts, 
        "anomaly_data": anomaly_data,
        "additional_metrics": additional_metrics
    })
def count_protocol_types(df):
    tcp_count = 0
    udp_count = 0
    icmp_count = 0

    for index, row in df.iterrows():
        protocol_type = row['protocol_type'].lower()
        if protocol_type == 'tcp':
            tcp_count += 1
        elif protocol_type == 'udp':
            udp_count += 1
        elif protocol_type == 'icmp':
            icmp_count += 1

    return {"TCP": tcp_count, "UDP": udp_count, "ICMP": icmp_count}


def detect_anomalies(df):
    if 'class' in df.columns:
        normal_count = df[df['class'] == 'normal'].shape[0]
        abnormal_count = df[df['class'] != 'normal'].shape[0]
    else:
        normal_count = df.shape[0]
        abnormal_count = 0

    return {"normal": normal_count, "abnormal": abnormal_count}


if __name__ == '__main__':
    app.run(debug=True)
