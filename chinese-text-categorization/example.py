from preprocessor import Preprocessor
from vectorizer import TFIDFVectorizer
from classifier import NaiveBayesClassifier, SVMClassifier
from evaluator import ModelEvaluator


def basic_example():
    print("=" * 50)
    print("基本使用示例")
    print("=" * 50)
    
    texts = [
        "这款手机的屏幕非常清晰，拍照效果也很棒。",
        "人工智能技术正在快速发展。",
        "这部电影的剧情非常感人，演员的表演也很出色。",
        "这首歌曲的旋律优美动听。",
        "今天的天气真好，阳光明媚。",
        "周末去公园野餐，享受大自然的美好时光。",
        "这道家常菜的做法很简单，但味道却非常美味。",
        "这家餐厅的环境优雅，服务周到。"
    ]
    
    labels = [
        "科技", "科技", "娱乐", "娱乐",
        "生活", "生活", "美食", "美食"
    ]
    
    print("\n1. 文本预处理...")
    preprocessor = Preprocessor()
    
    for i, text in enumerate(texts[:2]):
        words = preprocessor.preprocess(text)
        print(f"原文 {i+1}: {text}")
        print(f"分词后: {words}")
        print()
    
    print("2. TF-IDF 特征提取...")
    tokenized_texts = preprocessor.preprocess_list(texts)
    
    vectorizer = TFIDFVectorizer()
    X = vectorizer.fit_transform(tokenized_texts)
    
    print(f"特征矩阵形状: {X.shape}")
    print(f"特征词数量: {len(vectorizer.get_feature_names())}")
    print()
    
    print("3. 模型训练...")
    nb_classifier = NaiveBayesClassifier()
    nb_classifier.fit(X, labels)
    
    svm_classifier = SVMClassifier()
    svm_classifier.fit(X, labels)
    
    print("朴素贝叶斯模型训练完成")
    print("SVM 模型训练完成")
    print()
    
    print("4. 模型预测...")
    test_texts = [
        "这款新的笔记本电脑性能强劲，续航时间也很长。",
        "昨晚的演唱会太精彩了，歌手们的表现都很棒。",
        "每天坚持锻炼身体，保持健康的生活方式很重要。",
        "新鲜的食材是制作美味佳肴的关键。"
    ]
    
    test_tokenized = preprocessor.preprocess_list(test_texts)
    X_test = vectorizer.transform(test_tokenized)
    
    nb_predictions = nb_classifier.predict(X_test)
    svm_predictions = svm_classifier.predict(X_test)
    
    for text, nb_pred, svm_pred in zip(test_texts, nb_predictions, svm_predictions):
        print(f"\n文本: {text}")
        print(f"朴素贝叶斯预测: {nb_pred}")
        print(f"SVM 预测: {svm_pred}")
    
    print()
    print("5. 模型评估...")
    y_pred_nb = nb_classifier.predict(X)
    y_pred_svm = svm_classifier.predict(X)
    
    evaluator = ModelEvaluator()
    
    print("\n--- 朴素贝叶斯 ---")
    evaluator.print_evaluation(labels, y_pred_nb)
    
    print("\n--- SVM ---")
    evaluator.print_evaluation(labels, y_pred_svm)
    
    print("\n--- 模型对比 ---")
    predictions_dict = {
        'Naive Bayes': y_pred_nb,
        'SVM': y_pred_svm
    }
    evaluator.compare_models(labels, predictions_dict)
    
    print("\n" + "=" * 50)
    print("示例完成！")
    print("=" * 50)


if __name__ == '__main__':
    basic_example()
