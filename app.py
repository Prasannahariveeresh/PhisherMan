import pickle
import pandas as pd

from flask import Flask, request, jsonify
from flask_cors import CORS

from joblib import Parallel, delayed

from ml_utils.url_feature_extraction import PhishingFeatureExtractor

app = Flask(__name__)
CORS(app)

extractor = PhishingFeatureExtractor()
keys = [
    'URLLength', 'DomainLength', 'IsDomainIP', 'TLD', 'URLSimilarityIndex',
    'CharContinuationRate', 'TLDLegitimateProb', 'URLCharProb', 'TLDLength',
    'NoOfSubDomain', 'HasObfuscation', 'NoOfObfuscatedChar',
    'LetterRatioInURL', 'NoOfQMarkInURL', 'IsHTTPS', 'LineOfCode',
    'LargestLineLength', 'HasTitle', 'DomainTitleMatchScore', 'HasFavicon',
    'Robots', 'IsResponsive', 'NoOfURLRedirect', 'NoOfSelfRedirect',
    'HasDescription', 'NoOfPopup', 'NoOfiFrame', 'HasExternalFormSubmit',
    'HasSocialNet', 'HasSubmitButton', 'HasHiddenFields',
    'HasPasswordField', 'Bank', 'Pay', 'Crypto', 'HasCopyrightInfo',
    'NoOfImage', 'NoOfCSS', 'NoOfJS', 'NoOfSelfRef', 'NoOfEmptyRef'
]

rfc_model = None
with open('./ml_utils/random_forest_model.pkl', 'rb') as f:
    rfc_model = pickle.load(f)

def predict_link(link):
    if link == "#" or link.startswith("file://"):
        return None  # skip

    features = extractor.extract_features(link)
    vals = [features[key] for key in keys]
    pred = rfc_model.predict([vals])

    if pred[-1] == 1:
        return link
    return None

@app.route('/api/status', methods=['POST'])
def check_links():
    data = request.get_json()
    all_links = data.get('links', [])

    blocked = []

    results = Parallel(n_jobs=-1)(delayed(predict_link)(link) for link in all_links)
    blocked = [link for link in results if link is not None]

    return jsonify({"blocked_urls": blocked})

if __name__ == '__main__':
    app.run(debug=True)
