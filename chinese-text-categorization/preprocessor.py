import jieba
import os
from config import Config


class Preprocessor:
    def __init__(self, stop_words_file=None):
        if stop_words_file is None:
            stop_words_file = Config.STOP_WORDS_FILE
        self.stop_words = self._load_stop_words(stop_words_file)
        
    def _load_stop_words(self, filepath):
        stop_words = set()
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        stop_words.add(line)
        return stop_words
    
    def cut(self, text):
        return list(jieba.cut(text))
    
    def remove_stop_words(self, words):
        return [word for word in words if word not in self.stop_words and word.strip()]
    
    def preprocess(self, text):
        words = self.cut(text)
        words = self.remove_stop_words(words)
        return words
    
    def preprocess_list(self, texts):
        return [self.preprocess(text) for text in texts]
    
    def add_stop_word(self, word):
        self.stop_words.add(word)
    
    def remove_stop_word(self, word):
        if word in self.stop_words:
            self.stop_words.remove(word)
