import React from 'react';
import { useLayer } from '../../contexts/LayerContext';
import { Layer } from '../../types';
import './LayerPanel.css';

export const LayerPanel: React.FC = () => {
  const {
    layers,
    currentLayerId,
    addLayer,
    removeLayer,
    updateLayer,
    setCurrentLayer,
    moveLayerUp,
    moveLayerDown,
  } = useLayer();

  const sortedLayers = [...layers].sort((a, b) => b.order - a.order);

  return (
    <div className="layer-panel">
      <div className="panel-header">
        <h3 className="panel-title">图层</h3>
        <button className="add-layer-button" onClick={addLayer} title="添加图层">
          ➕
        </button>
      </div>

      <div className="layer-list">
        {sortedLayers.map((layer) => (
          <div
            key={layer.id}
            className={`layer-item ${currentLayerId === layer.id ? 'active' : ''}`}
            onClick={() => setCurrentLayer(layer.id)}
          >
            <div className="layer-info">
              <span className="layer-name">{layer.name}</span>
            </div>

            <div className="layer-controls">
              <button
                className={`layer-control-button ${layer.visible ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  updateLayer(layer.id, { visible: !layer.visible });
                }}
                title={layer.visible ? '隐藏图层' : '显示图层'}
              >
                {layer.visible ? '👁️' : '👁️‍🗨️'}
              </button>

              <button
                className={`layer-control-button ${layer.locked ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  updateLayer(layer.id, { locked: !layer.locked });
                }}
                title={layer.locked ? '解锁图层' : '锁定图层'}
              >
                {layer.locked ? '🔒' : '🔓'}
              </button>

              <button
                className="layer-control-button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayerUp(layer.id);
                }}
                title="上移图层"
                disabled={sortedLayers.indexOf(layer) === 0}
              >
                ⬆️
              </button>

              <button
                className="layer-control-button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayerDown(layer.id);
                }}
                title="下移图层"
                disabled={sortedLayers.indexOf(layer) === sortedLayers.length - 1}
              >
                ⬇️
              </button>

              <button
                className="layer-control-button delete"
                onClick={(e) => {
                  e.stopPropagation();
                  if (layers.length > 1) {
                    removeLayer(layer.id);
                  }
                }}
                title="删除图层"
                disabled={layers.length <= 1}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="layer-info-text">
        <span>当前图层: {layers.find(l => l.id === currentLayerId)?.name}</span>
        <span>图层数量: {layers.length}</span>
      </div>
    </div>
  );
};
