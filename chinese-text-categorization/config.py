class Config:
    STOP_WORDS_FILE = 'data/stop_words.txt'
    MODEL_PATH = 'models/'
    VECTORIZER_PATH = 'models/vectorizer.pkl'
    
    RANDOM_STATE = 42
    TEST_SIZE = 0.2
    
    TFIDF_MAX_FEATURES = 5000
    TFIDF_NGRAM_RANGE = (1, 2)
