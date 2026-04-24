from flask import Flask, request, jsonify
import os
from preprocessor import Preprocessor
from vectorizer import TFIDFVectorizer
from classifier import NaiveBayesClassifier, SVMClassifier
from config import Config

app = Flask(__name__)

preprocessor = None
vectorizer = None
classifier = None
model_type = None


def init_models(load_saved=False, classifier_type='naive_bayes'):
    global preprocessor, vectorizer, classifier, model_type
    
    preprocessor = Preprocessor()
    
    vectorizer = TFIDFVectorizer()
    
    if classifier_type == 'naive_bayes':
        classifier = NaiveBayesClassifier()
        model_type = 'naive_bayes'
    elif classifier_type == 'svm':
        classifier = SVMClassifier()
        model_type = 'svm'
    else:
        raise ValueError(f"Unknown classifier type: {classifier_type}")
    
    if load_saved:
        vectorizer_path = Config.VECTORIZER_PATH
        model_path = os.path.join(Config.MODEL_PATH, f'{model_type}_model.pkl')
        
        if os.path.exists(vectorizer_path) and os.path.exists(model_path):
            vectorizer.load(vectorizer_path)
            classifier.load(model_path)
            app.logger.info(f"Loaded saved {model_type} model and vectorizer")
        else:
            app.logger.warning("Saved model or vectorizer not found, using untrained model")


@app.route('/predict', methods=['POST'])
def predict():
    global preprocessor, vectorizer, classifier
    
    if not vectorizer.is_fitted or classifier.model is None:
        return jsonify({
            'error': 'Model not trained. Please train the model first or load a saved model.'
        }), 400
    
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing required field: text'}), 400
    
    text = data['text']
    
    if not isinstance(text, str) or not text.strip():
        return jsonify({'error': 'Text must be a non-empty string'}), 400
    
    try:
        tokenized = preprocessor.preprocess(text)
        
        X = vectorizer.transform([tokenized])
        
        prediction = classifier.predict(X)[0]
        
        probabilities = None
        try:
            proba = classifier.predict_proba(X)[0]
            probabilities = {
                str(cls): float(prob)
                for cls, prob in zip(classifier.classes_, proba)
            }
        except:
            pass
        
        result = {
            'text': text,
            'tokenized': tokenized,
            'prediction': str(prediction),
            'model_type': model_type
        }
        
        if probabilities:
            result['probabilities'] = probabilities
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    global preprocessor, vectorizer, classifier
    
    if not vectorizer.is_fitted or classifier.model is None:
        return jsonify({
            'error': 'Model not trained. Please train the model first or load a saved model.'
        }), 400
    
    data = request.get_json()
    
    if not data or 'texts' not in data:
        return jsonify({'error': 'Missing required field: texts'}), 400
    
    texts = data['texts']
    
    if not isinstance(texts, list) or len(texts) == 0:
        return jsonify({'error': 'Texts must be a non-empty list'}), 400
    
    try:
        tokenized_texts = [preprocessor.preprocess(text) for text in texts]
        
        X = vectorizer.transform(tokenized_texts)
        
        predictions = classifier.predict(X)
        
        predictions = [str(pred) for pred in predictions]
        
        result = {
            'predictions': [
                {
                    'text': text,
                    'tokenized': tokenized,
                    'prediction': prediction
                }
                for text, tokenized, prediction in zip(texts, tokenized_texts, predictions)
            ],
            'model_type': model_type
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/train', methods=['POST'])
def train():
    global preprocessor, vectorizer, classifier, model_type
    
    data = request.get_json()
    
    if not data or 'texts' not in data or 'labels' not in data:
        return jsonify({'error': 'Missing required fields: texts and labels'}), 400
    
    texts = data['texts']
    labels = data['labels']
    
    if len(texts) != len(labels):
        return jsonify({'error': 'Number of texts must match number of labels'}), 400
    
    if 'classifier_type' in data:
        classifier_type = data['classifier_type']
        if classifier_type == 'naive_bayes':
            classifier = NaiveBayesClassifier()
            model_type = 'naive_bayes'
        elif classifier_type == 'svm':
            classifier = SVMClassifier()
            model_type = 'svm'
    
    try:
        tokenized_texts = [preprocessor.preprocess(text) for text in texts]
        
        X = vectorizer.fit_transform(tokenized_texts)
        
        classifier.fit(X, labels)
        
        save = data.get('save', False)
        if save:
            os.makedirs(Config.MODEL_PATH, exist_ok=True)
            vectorizer.save(Config.VECTORIZER_PATH)
            classifier.save(os.path.join(Config.MODEL_PATH, f'{model_type}_model.pkl'))
        
        return jsonify({
            'message': 'Model trained successfully',
            'model_type': model_type,
            'num_samples': len(texts),
            'saved': save
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    global vectorizer, classifier, model_type
    
    status = {
        'status': 'healthy',
        'model_loaded': vectorizer.is_fitted and classifier.model is not None,
        'model_type': model_type if model_type else 'not_loaded'
    }
    
    return jsonify(status)


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Chinese Text Classification API')
    parser.add_argument('--load-model', action='store_true', help='Load saved model')
    parser.add_argument('--classifier', default='naive_bayes', choices=['naive_bayes', 'svm'],
                        help='Classifier type (default: naive_bayes)')
    parser.add_argument('--port', type=int, default=5000, help='Port number (default: 5000)')
    parser.add_argument('--debug', action='store_true', help='Run in debug mode')
    
    args = parser.parse_args()
    
    init_models(load_saved=args.load_model, classifier_type=args.classifier)
    
    app.run(host='0.0.0.0', port=args.port, debug=args.debug)
