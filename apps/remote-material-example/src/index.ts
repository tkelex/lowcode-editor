import './contract';
import { exampleMaterial } from './constants';
import { createCustomerMetricCard } from './customer-metric-card';
import { createCustomerMetricCardDev } from './customer-metric-card-dev';
import { createCustomerMetricCardEditorDefinition } from './editor-definition';

const host = window.__LOWCODE_MATERIAL_HOST__;

if (!host) {
  throw new Error('远程物料宿主尚未安装');
}

const CustomerMetricCard = createCustomerMetricCard(host);
const CustomerMetricCardDev = createCustomerMetricCardDev(host, CustomerMetricCard);
const CustomerMetricCardEditorDefinition = createCustomerMetricCardEditorDefinition(
  CustomerMetricCardDev,
  CustomerMetricCard,
);

host.register({
  protocolVersion: exampleMaterial.protocolVersion,
  name: exampleMaterial.packageName,
  version: exampleMaterial.version,
  schemaVersion: exampleMaterial.schemaVersion,
  materials: {
    [exampleMaterial.materialName]: CustomerMetricCard,
  },
  editorMaterials: {
    [exampleMaterial.materialName]: CustomerMetricCardEditorDefinition,
  },
});
