from preprocessor import Preprocessor
from vectorizer import TFIDFVectorizer
from classifier import NaiveBayesClassifier, SVMClassifier
from config import Config
import os

print("测试加载已保存的模型...")
print("=" * 50)

# 检查模型文件是否存在
vectorizer_path = Config.VECTORIZER_PATH
nb_model_path = os.path.join(Config.MODEL_PATH, 'naive_bayes_model.pkl')
svm_model_path = os.path.join(Config.MODEL_PATH, 'svm_model.pkl')

print(f"\n检查模型文件:")
print(f"Vectorizer: {os.path.exists(vectorizer_path)}")
print(f"Naive Bayes: {os.path.exists(nb_model_path)}")
print(f"SVM: {os.path.exists(svm_model_path)}")

# 加载模型
print("\n加载模型...")
preprocessor = Preprocessor()

vectorizer = TFIDFVectorizer()
vectorizer.load(vectorizer_path)
print("[OK] Vectorizer 加载成功")

nb_classifier = NaiveBayesClassifier()
nb_classifier.load(nb_model_path)
print("[OK] Naive Bayes 模型加载成功")

svm_classifier = SVMClassifier()
svm_classifier.load(svm_model_path)
print("[OK] SVM 模型加载成功")

# 测试预测
print("\n测试预测功能...")
test_texts = [
    "这款智能手机的性能非常出色",
    "这部电影的剧情很精彩",
    "今天天气很好适合出门",
    "这道菜味道很不错"
]

for text in test_texts:
    tokenized = preprocessor.preprocess(text)
    X = vectorizer.transform([tokenized])

    nb_pred = nb_classifier.predict(X)[0]
    svm_pred = svm_classifier.predict(X)[0]

    print(f"\n文本: {text}")
    print(f"  NB预测: {nb_pred}, SVM预测: {svm_pred}")

print("\n" + "=" * 50)
print("[OK] 模型加载和预测测试通过！")
