import type { ChecklistTemplate } from '@vo360/shared';
import { foodPreShipment } from './food-pre-shipment';
import { pharmaQms } from './pharma-qms';
import { retailInline } from './retail-inline';

export const TEMPLATES: ChecklistTemplate[] = [foodPreShipment, pharmaQms, retailInline];

export { foodPreShipment, pharmaQms, retailInline };
export * from './vendors';
export * from './users';
