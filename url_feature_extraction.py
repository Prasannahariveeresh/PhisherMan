import re
import requests
import difflib
import pandas as pd

from Enum import *
from itertools import groupby
from bs4 import BeautifulSoup
from urllib.parse import urlparse

class PhishingFeatureExtractor:
    def __init__(self):
        df = pd.read_csv('PhiUSIIL_Phishing_URL_Dataset.csv')
        df = df.loc[df['label'] == 0]
        self.legit_domains = df['URL'].tolist()
        self.social_nets = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com']

    def extract_features(self, url):
        parsed = self._parse_url(url)
        domain = parsed.netloc
        path = parsed.path
        tld = self._get_tld(domain)

        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, timeout=5, headers=headers)
            html = response.text
            soup = BeautifulSoup(html, 'html.parser')
        except:
            html = ''
            soup = BeautifulSoup('', 'html.parser')
            response = type('Response', (), {'history': [], 'url': url})()

        features = {
            'URLLength': len(url),
            'DomainLength': len(domain),
            'IsDomainIP': self._is_ip(domain),
            'TLD': self._tld_index(tld),
            'URLSimilarityIndex': self._url_similarity(domain),
            'CharContinuationRate': self._char_continuation(url),
            'TLDLegitimateProb': self._tld_legitimacy(tld),
            'URLCharProb': self._url_char_prob(url),
            'TLDLength': len(tld),
            'NoOfSubDomain': len(domain.split('.')) - 2,
            'HasObfuscation': self._has_obfuscation(url),
            'NoOfObfuscatedChar': self._count_obfuscation(url),
            'LetterRatioInURL': sum(c.isalpha() for c in url) / len(url),
            'NoOfQMarkInURL': url.count('?'),
            'IsHTTPS': int(parsed.scheme == 'https'),
            'LineOfCode': html.count('\n'),
            'LargestLineLength': max((len(line) for line in html.splitlines()), default=0),
            'HasTitle': int(bool(soup.title and soup.title.string.strip())),
            'DomainTitleMatchScore': self._domain_title_match(domain, soup),
            'HasFavicon': int(bool(soup.find('link', rel=lambda x: x and 'icon' in x.lower()))),
            'Robots': self._has_robots_txt(domain),
            'IsResponsive': self._is_responsive(soup),
            'NoOfURLRedirect': len(getattr(response, 'history', [])),
            'NoOfSelfRedirect': self._count_self_redirects(response, domain),
            'HasDescription': int(bool(soup.find('meta', attrs={'name': 'description'}))),
            'NoOfPopup': html.lower().count('window.open'),
            'NoOfiFrame': len(soup.find_all('iframe')),
            'HasExternalFormSubmit': self._external_form_submit(soup, domain),
            'HasSocialNet': self._has_social_links(soup),
            'HasSubmitButton': int(bool(soup.find('input', {'type': 'submit'}))),
            'HasHiddenFields': int(bool(soup.find('input', {'type': 'hidden'}))),
            'HasPasswordField': int(bool(soup.find('input', {'type': 'password'}))),
            'Bank': int('bank' in url.lower()),
            'Pay': int('pay' in url.lower()),
            'Crypto': int('crypto' in url.lower()),
            'HasCopyrightInfo': int('©' in html or 'copyright' in html.lower()),
            'NoOfImage': len(soup.find_all('img')),
            'NoOfCSS': len(soup.find_all('link', rel='stylesheet')),
            'NoOfJS': len(soup.find_all('script')),
            'NoOfSelfRef': html.count(url),
            'NoOfEmptyRef': html.count('href=""')
        }
        return features

    def _parse_url(self, url):
        if not url.startswith(('http://', 'https://')):
            url = 'http://' + url
        return urlparse(url)

    def _is_ip(self, domain):
        return int(re.fullmatch(r'\d{1,3}(\.\d{1,3}){3}', domain) is not None)

    def _get_tld(self, domain):
        return domain.split('.')[-1] if '.' in domain else ''

    def _tld_index(self, tld):
        known_tlds = TLD
        return known_tlds.index(tld) if tld in known_tlds else -1

    def _url_similarity(self, domain):
        return max(difflib.SequenceMatcher(None, domain, legit).ratio() for legit in self.legit_domains) * 100

    def _char_continuation(self, url):
        max_repeat = max((len(list(g)) for _, g in groupby(url)), default=1)
        return max_repeat / len(url)

    def _tld_legitimacy(self, tld):
        tld_scores = {'com': 0.9, 'org': 0.8, 'net': 0.85}
        return tld_scores.get(tld, 0.5)

    def _url_char_prob(self, url):
        return sum(c.isalpha() for c in url) / len(url)

    def _has_obfuscation(self, url):
        return int(any(c in url for c in ['@', '-', '_', '=', '&', '$']))

    def _count_obfuscation(self, url):
        return sum(url.count(c) for c in ['@', '-', '_', '=', '&', '$'])

    def _domain_title_match(self, domain, soup):
        title = soup.title.string.lower() if soup.title and soup.title.string else ''
        core = domain.split('.')[-2] if '.' in domain else domain
        return difflib.SequenceMatcher(None, core, title).ratio()

    def _has_robots_txt(self, domain):
        try:
            r = requests.get(f"http://{domain}/robots.txt", timeout=3)
            return int(r.status_code == 200)
        except:
            return 0

    def _is_responsive(self, soup):
        return int(soup.find('meta', attrs={'name': 'viewport'}) is not None)

    def _count_self_redirects(self, response, domain):
        return sum(1 for r in getattr(response, 'history', []) if domain in r.url)

    def _external_form_submit(self, soup, domain):
        for form in soup.find_all('form'):
            if form.get('action') and domain not in form['action']:
                return 1
        return 0

    def _has_social_links(self, soup):
        return int(any(sn in a['href'] for a in soup.find_all('a', href=True) for sn in self.social_nets))


if __name__ == "__main__":
    extractor = PhishingFeatureExtractor()
    features = extractor.extract_features("https://www.cornerstoneinsurance.ca")
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
       'NoOfImage', 'NoOfCSS', 'NoOfJS', 'NoOfSelfRef', 'NoOfEmptyRef', 'label'
    ]

    vals = [features[key] for key in keys]
    print(vals)
