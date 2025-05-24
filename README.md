# 🛡️ Phisherman

**Phisherman** is a phishing detection system powered by a custom feature-rich dataset built using data from [PhishTank](https://www.phishtank.com/). It integrates a machine learning-based classifier with a real-time browser extension to detect and block phishing URLs as users browse the web.

---

## 📌 Overview

Phisherman is designed to address modern phishing threats by analyzing URLs and web content for suspicious patterns and characteristics. The system includes:

- A **custom dataset** with intelligent feature extraction from PhishTank.
- A **machine learning model** trained on 45+ features.
- A **browser extension** that alerts users of phishing attempts in real-time.

---

## 📊 Dataset Features

The dataset is crafted from URLs (mostly phishing examples from PhishTank) and analyzed to extract the following features:

### 🔗 URL-Based Features

- `URLLength`: Total length of the URL.
- `DomainLength`: Length of the domain part.
- `IsDomainIP`: Whether the domain is an IP address.
- `TLD`: Top-Level Domain used.
- `URLSimilarityIndex`: Similarity of URL to known brands/domains.
- `CharContinuationRate`: Ratio of repeated characters.
- `TLDLegitimateProb`: Probability of TLD being legitimate.
- `URLCharProb`: Character distribution anomaly score.
- `TLDLength`: Length of the TLD.
- `NoOfSubDomain`: Number of subdomains.
- `HasObfuscation`: If obfuscation techniques are used (e.g., hexadecimal, encoding).
- `NoOfObfuscatedChar`: Count of obfuscated characters.
- `LetterRatioInURL`: Ratio of alphabetic characters in URL.
- `NoOfQMarkInURL`: Number of `?` in URL.
- `IsHTTPS`: Whether HTTPS is used.

### 🕸️ Page-Level Features

- `LineOfCode`: Total lines of HTML code.
- `LargestLineLength`: Length of the longest HTML line.
- `HasTitle`: If the page has a `<title>`.
- `DomainTitleMatchScore`: Similarity score between domain and title.
- `HasFavicon`: Whether the site uses a favicon.
- `Robots`: Presence of `robots.txt`.
- `IsResponsive`: Whether the site layout is responsive.
- `NoOfURLRedirect`: Number of redirect links.
- `NoOfSelfRedirect`: Number of redirects to the same domain.
- `HasDescription`: If a meta description is present.
- `NoOfPopup`: Number of popup dialogs.
- `NoOfiFrame`: Number of `<iframe>` elements.
- `HasExternalFormSubmit`: If form actions point to external URLs.
- `HasSocialNet`: If links to social networks are present.
- `HasSubmitButton`: Whether a submit button exists.
- `HasHiddenFields`: Presence of hidden form fields.
- `HasPasswordField`: Whether a password input exists.

### 💳 Semantic and Content Features

- `Bank`, `Pay`, `Crypto`: Presence of financial keywords.
- `HasCopyrightInfo`: Detection of copyright notices.
- `NoOfImage`: Number of image files.
- `NoOfCSS`: Number of stylesheets.
- `NoOfJS`: Number of JavaScript files.
- `NoOfSelfRef`: Number of links pointing to self.
- `NoOfEmptyRef`: Empty or `#` links.

---

## 🧠 Model Training

The model is trained using supervised learning techniques Random Forest and a custom MLP on the above features. Evaluation metrics include ROC-AUC and confusion matrix to ensure high accuracy and robustness against false positives.

---

## 🧩 Browser Extension

The Phisherman browser extension:

- Automatically extracts features from current site.
- Runs the phishing detection model in the cloud.
- Notifies the users where phishing links are present.
- Optionally blocks suspicious pages or redirects the user to a warning page.

---

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/phisherman.git
   cd phisherman
    ```

2. Run the backend server:

   ```bash
   python app.py
   ```

3. Load the browser extension from `/chrome_extension` folder into your browser (Developer Mode required).

---

---

## 📷 Screenshots


## 🙋‍♀️ Contributers

[Prasannahariveeresh J R](https://www.github.com/Prasannahariveeresh)
[Saswath A](https://www.github.com/Saswath-A)

---

## 🔗 Acknowledgments

* [PhishTank](https://www.phishtank.com/) for the phishing dataset.
* Open-source tools used for feature extraction and browser extension development.

```
