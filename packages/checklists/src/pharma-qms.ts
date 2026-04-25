import type { ChecklistTemplate, Verdict } from '@vo360/shared';

const ALL: Verdict[] = ['majorly_comply', 'partial_comply', 'not_complied', 'na'];

/**
 * Pharma QMS Audit — internal/vendor audit aligned to WHO-GMP and Schedule M
 * for oral solid dose / liquid manufacturing facilities. Coverage spans QMS,
 * documentation, personnel, facility, materials and QC lab.
 */
export const pharmaQms: ChecklistTemplate = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Pharma QMS Audit',
  industry: 'pharma',
  version: 1,
  isActive: true,
  sections: [
    {
      id: '22222222-2222-2222-2222-2222bbbb0001',
      name: 'Quality Management System',
      order: 1,
      questions: [
        {
          id: '22222222-2222-2222-2222-2222bbbb1001',
          text: 'Is the Quality Manual current, approved and accessible to relevant personnel?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1002',
          text: 'Are SOPs available at point of use and within their review date?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1003',
          text: 'Are deviation reports raised, investigated and CAPAs closed within timelines?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1004',
          text: 'Is the change control process being followed with QA approval before implementation?',
          isMandatory: true,
          responseOptions: ALL,
          order: 4,
        },
      ],
    },
    {
      id: '22222222-2222-2222-2222-2222bbbb0002',
      name: 'Documentation & Records',
      order: 2,
      questions: [
        {
          id: '22222222-2222-2222-2222-2222bbbb1005',
          text: 'Are batch manufacturing records (BMR) complete, contemporaneous and reviewed?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1006',
          text: 'Are batch packaging records (BPR) signed by supervisor and QA before release?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1007',
          text: 'Are equipment logbooks current with usage, cleaning and maintenance entries?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1008',
          text: 'Is electronic data integrity (audit trails, time-stamps, user access) verified per ALCOA+?',
          isMandatory: true,
          responseOptions: ALL,
          order: 4,
        },
      ],
    },
    {
      id: '22222222-2222-2222-2222-2222bbbb0003',
      name: 'Personnel & Training',
      order: 3,
      questions: [
        {
          id: '22222222-2222-2222-2222-2222bbbb1009',
          text: 'Are training records current for all GMP-relevant personnel including refresher cycles?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1010',
          text: 'Is gowning procedure followed in classified areas (Grade C/D as applicable)?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1011',
          text: 'Are health checks documented for production staff including pre-employment medicals?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
      ],
    },
    {
      id: '22222222-2222-2222-2222-2222bbbb0004',
      name: 'Facility & Equipment',
      order: 4,
      questions: [
        {
          id: '22222222-2222-2222-2222-2222bbbb1012',
          text: 'Are HVAC pressure differentials between classified areas within specification?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1013',
          text: 'Is environmental monitoring data (viable + non-viable particles) within action limits?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1014',
          text: 'Are equipment calibration certificates current for critical instruments?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1015',
          text: 'Is the preventive maintenance schedule adhered to without overdue items?',
          isMandatory: true,
          responseOptions: ALL,
          order: 4,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1016',
          text: 'Are cleaning validation records present for product changeover on shared equipment?',
          isMandatory: true,
          responseOptions: ALL,
          order: 5,
        },
      ],
    },
    {
      id: '22222222-2222-2222-2222-2222bbbb0005',
      name: 'Materials & Products',
      order: 5,
      questions: [
        {
          id: '22222222-2222-2222-2222-2222bbbb1017',
          text: 'Is raw material quarantine and release process followed with QC approval?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1018',
          text: 'Are reference samples and retention samples maintained per regulatory requirement?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1019',
          text: 'Is stability data current for all marketed products with no out-of-trend results?',
          isMandatory: false,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1020',
          text: 'Has the product recall procedure been mock-tested in the last 12 months?',
          isMandatory: false,
          responseOptions: ALL,
          order: 4,
        },
      ],
    },
    {
      id: '22222222-2222-2222-2222-2222bbbb0006',
      name: 'Quality Control Lab',
      order: 6,
      questions: [
        {
          id: '22222222-2222-2222-2222-2222bbbb1021',
          text: 'Are analytical method validation records current and approved?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1022',
          text: 'Are reagent and reference standard expiries tracked and labelled?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '22222222-2222-2222-2222-2222bbbb1023',
          text: 'Are out-of-specification investigations documented with phase 1 / phase 2 conclusions?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
      ],
    },
  ],
};
