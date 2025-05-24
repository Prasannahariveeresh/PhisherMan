import pandas as pd
from tqdm import tqdm

from ml_utils.url_feature_extraction import PhishingFeatureExtractor

phish_df = pd.read_csv("./datasets/phishing_18_features.csv")

df_phish = phish_df.loc[phish_df['label'] == 1]
df_legit = phish_df.loc[phish_df['label'] == 0]

df = pd.concat([df_legit[:500], df_phish[:500]])

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

data = []

for url in tqdm(df['url']):
    try:
        features = extractor.extract_features(url)
        vals = [features[key] for key in keys]
        vals.append(int(df['label'].iloc[(list(df['url']).index(url))]))
        data.append(vals)
    except:
        continue
    
phi = pd.read_csv('init.csv')
dataset = pd.DataFrame(data, columns=keys + ['label'])
dataset = pd.concat([phi, dataset])
dataset.to_csv("initv2.csv", index=False)