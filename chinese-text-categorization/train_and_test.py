import pandas as pd
from sklearn.model_selection import train_test_split
import os

from preprocessor import Preprocessor
from vectorizer import TFIDFVectorizer
from classifier import NaiveBayesClassifier, SVMClassifier
from evaluator import ModelEvaluator
from config import Config


def load_data(filepath):
    df = pd.read_csv(filepath)
    return df['text'].tolist(), df['label'].tolist()


def main():
    print("=" * 60)
    print("中文文本分类器训练与测试")
    print("=" * 60)
    
    data_path = 'data/sample_data.csv'
    if not os.path.exists(data_path):
        print(f"数据文件不存在: {data_path}")
        print("请确保数据文件存在或提供正确的路径。")
        return
    
    print("\n[1/5] 加载数据...")
    texts, labels = load_data(data_path)
    print(f"共加载 {len(texts)} 条数据")
    
    print("\n[2/5] 数据划分...")
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels,
        test_size=Config.TEST_SIZE,
        random_state=Config.RANDOM_STATE,
        stratify=labels
    )
    print(f"训练集: {len(X_train)} 条, 测试集: {len(X_test)} 条")
    
    print("\n[3/5] 文本预处理...")
    preprocessor = Preprocessor()
    X_train_tokenized = preprocessor.preprocess_list(X_train)
    X_test_tokenized = preprocessor.preprocess_list(X_test)
    print("预处理完成")
    
    print("\n[4/5] TF-IDF 特征提取...")
    vectorizer = TFIDFVectorizer()
    X_train_tfidf = vectorizer.fit_transform(X_train_tokenized)
    X_test_tfidf = vectorizer.transform(X_test_tokenized)
    print(f"特征维度: {X_train_tfidf.shape[1]}")
    
    print("\n[5/5] 模型训练与评估...")
    print("\n--- 朴素贝叶斯分类器 ---")
    nb_classifier = NaiveBayesClassifier()
    nb_classifier.fit(X_train_tfidf, y_train)
    y_pred_nb = nb_classifier.predict(X_test_tfidf)
    
    print("\n--- SVM 分类器 ---")
    svm_classifier = SVMClassifier()
    svm_classifier.fit(X_train_tfidf, y_train)
    y_pred_svm = svm_classifier.predict(X_test_tfidf)
    
    print("\n" + "=" * 60)
    print("模型评估结果")
    print("=" * 60)
    
    evaluator = ModelEvaluator(average='weighted')
    
    unique_labels = sorted(list(set(labels)))
    
    print("\n--- 朴素贝叶斯 ---")
    evaluator.print_evaluation(y_test, y_pred_nb, target_names=unique_labels)
    
    print("\n--- SVM ---")
    evaluator.print_evaluation(y_test, y_pred_svm, target_names=unique_labels)
    
    print("\n--- 模型对比 ---")
    predictions_dict = {
        'Naive Bayes': y_pred_nb,
        'SVM': y_pred_svm
    }
    evaluator.compare_models(y_test, predictions_dict)
    
    print("\n" + "=" * 60)
    print("预测示例")
    print("=" * 60)
    
    sample_texts = [
        "这款新手机的摄像头功能非常强大，拍照效果很好。",
        "昨天看的那部电影真的太好看了，强烈推荐！",
        "周末和朋友一起去爬山，享受大自然的美好。",
        "这家餐厅的川菜做得非常地道，麻辣鲜香。"
    ]
    
    for text in sample_texts:
        tokenized = preprocessor.preprocess(text)
        X = vectorizer.transform([tokenized])
        pred_nb = nb_classifier.predict(X)[0]
        pred_svm = svm_classifier.predict(X)[0]
        
        print(f"\n文本: {text}")
        print(f"分词结果: {tokenized}")
        print(f"朴素贝叶斯预测: {pred_nb}")
        print(f"SVM 预测: {pred_svm}")
    
    print("\n" + "=" * 60)
    print("保存模型...")
    print("=" * 60)
    
    os.makedirs(Config.MODEL_PATH, exist_ok=True)
    
    vectorizer.save(Config.VECTORIZER_PATH)
    print(f"向量化器已保存到: {Config.VECTORIZER_PATH}")
    
    nb_model_path = os.path.join(Config.MODEL_PATH, 'naive_bayes_model.pkl')
    nb_classifier.save(nb_model_path)
    print(f"朴素贝叶斯模型已保存到: {nb_model_path}")
    
    svm_model_path = os.path.join(Config.MODEL_PATH, 'svm_model.pkl')
    svm_classifier.save(svm_model_path)
    print(f"SVM 模型已保存到: {svm_model_path}")
    
    print("\n" + "=" * 60)
    print("训练完成！")
    print("=" * 60)
    print("\n使用方式:")
    print("1. 启动 API 服务: python app.py --load-model --classifier naive_bayes")
    print("2. 单文本预测: POST http://localhost:5000/predict")
    print("   请求体: {\"text\": \"你的文本内容\"}")
    print("3. 批量预测: POST http://localhost:5000/predict/batch")
    print("   请求体: {\"texts\": [\"文本1\", \"文本2\", ...]}")
    print("=" * 60)


if __name__ == '__main__':
    main()
