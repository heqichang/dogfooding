from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)
import pandas as pd


class ModelEvaluator:
    def __init__(self, average='weighted'):
        self.average = average
    
    def evaluate(self, y_true, y_pred, labels=None, target_names=None):
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, average=self.average, zero_division=0),
            'recall': recall_score(y_true, y_pred, average=self.average, zero_division=0),
            'f1': f1_score(y_true, y_pred, average=self.average, zero_division=0)
        }
        
        report = classification_report(
            y_true, y_pred,
            labels=labels,
            target_names=target_names,
            output_dict=True,
            zero_division=0
        )
        
        conf_matrix = confusion_matrix(y_true, y_pred, labels=labels)
        
        return {
            'metrics': metrics,
            'classification_report': report,
            'confusion_matrix': conf_matrix
        }
    
    def print_evaluation(self, y_true, y_pred, labels=None, target_names=None):
        result = self.evaluate(y_true, y_pred, labels=labels, target_names=target_names)
        
        print("=" * 50)
        print("模型评估结果")
        print("=" * 50)
        print(f"准确率 (Accuracy): {result['metrics']['accuracy']:.4f}")
        print(f"精确率 (Precision): {result['metrics']['precision']:.4f}")
        print(f"召回率 (Recall): {result['metrics']['recall']:.4f}")
        print(f"F1 值 (F1 Score): {result['metrics']['f1']:.4f}")
        print("=" * 50)
        
        print("\n分类报告:")
        print(classification_report(
            y_true, y_pred,
            labels=labels,
            target_names=target_names,
            zero_division=0
        ))
        
        print("混淆矩阵:")
        print(result['confusion_matrix'])
        
        return result
    
    def compare_models(self, y_true, predictions_dict, labels=None, target_names=None):
        comparison = []
        
        for model_name, y_pred in predictions_dict.items():
            metrics = {
                'Model': model_name,
                'Accuracy': accuracy_score(y_true, y_pred),
                'Precision': precision_score(y_true, y_pred, average=self.average, zero_division=0),
                'Recall': recall_score(y_true, y_pred, average=self.average, zero_division=0),
                'F1': f1_score(y_true, y_pred, average=self.average, zero_division=0)
            }
            comparison.append(metrics)
        
        df = pd.DataFrame(comparison)
        df = df.set_index('Model')
        
        print("=" * 70)
        print("模型对比结果")
        print("=" * 70)
        print(df.to_string(float_format='%.4f'))
        print("=" * 70)
        
        return df
