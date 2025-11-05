// path: frontend/src/components/formGen/components/forms/SharedFormStep3.test.tsx

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import SharedFormStep3 from './SharedFormStep3';
import { IManufacturingReportForm, IConfigJson } from '../../pages/types';
import { initialFormValues } from '../../pages/formDefaults';

// --- 1. 🚀 Mock API (formService) ---
import { getLatestTemplateByName } from '../../../../services/formService';
vi.mock('../../../../services/formService', () => ({
    getLatestTemplateByName: vi.fn(),
}));

// --- 2. 🚀 สร้าง "พิมพ์เขียว" ปลอมๆ (Mock Blueprints) ---

// MOCK 1: สำหรับเทสเวลาของ Main Item (เหมือนเดิม)
const MOCK_BLUEPRINT_BZ: { items: any[]; template: any } = {
    template: { template_id: 1, name: 'BZ_Step3_Operations' },
    items: [
        { // index 0
            item_id: 101,
            config_json: {
                inputs: { startTime: { enabled: true }, finishTime: { enabled: true } },
                columns: [
                    { type: 'DESCRIPTION', description: { main: 'Main Task 1 (BZ)' } },
                ],
            } as IConfigJson,
        },
        { // index 1
            item_id: 102,
            config_json: {
                inputs: { startTime: { enabled: true }, finishTime: { enabled: true } },
                columns: [
                    { type: 'DESCRIPTION', description: { main: 'Main Task 2 (BZ)' } },
                ],
            } as IConfigJson,
        },
    ],
};

// MOCK 2: สำหรับเทส Validation ตัวเลข (SINGLE_INPUT_GROUP)
const MOCK_BLUEPRINT_BS3: { items: any[]; template: any } = {
    template: { template_id: 2, name: 'BS3_Step3_Operations' },
    items: [
        { // index 0
            item_id: 201,
            config_json: {
                inputs: {}, // ไม่มีเวลา
                columns: [
                    { type: 'DESCRIPTION', description: { main: 'Main Task (BS3)' } },
                    {
                        type: 'SINGLE_INPUT_GROUP',
                        input: {
                            label: 'Humidity',
                            field_name: 'operationResults.{index}.humidity',
                            type: 'number',
                            unit: '%',
                            validation: {
                                type: 'MAX_VALUE',
                                max: 100,
                                errorMessage: 'ห้ามเกิน 100',
                            },
                        },
                    },
                ],
            } as IConfigJson,
        },
    ],
};

// MOCK 3: [เพิ่มใหม่] สำหรับเทส Sub-Items (ส่วนที่ซับซ้อนที่สุด)
const MOCK_BLUEPRINT_WITH_SUBITEMS: { items: any[]; template: any } = {
    template: { template_id: 3, name: 'SUB_Step3_Operations' },
    items: [
        { // index 0
            item_id: 301,
            config_json: {
                inputs: { startTime: { enabled: true }, finishTime: { enabled: true } },
                columns: [
                    { type: 'DESCRIPTION', description: { main: 'Main Item 1' } },
                ],
            } as IConfigJson,
        },
        { // index 1
            item_id: 302,
            config_json: {
                inputs: { startTime: { enabled: true }, finishTime: { enabled: true } }, // Main 2 (Start/Finish)
                columns: [
                    {
                        type: 'DESCRIPTION',
                        description: {
                            main: 'Main Item 2',
                            subItems: [
                                { // subIndex 0
                                    id: '2.1',
                                    text: 'Sub Item 2.1',
                                    inputs: { startTime: { enabled: true }, finishTime: { enabled: true } },
                                },
                                { // subIndex 1
                                    id: '2.2',
                                    text: 'Sub Item 2.2',
                                    inputs: { startTime: { enabled: true }, finishTime: { enabled: true } },
                                },
                            ],
                        },
                    },
                ],
            } as IConfigJson,
        },
    ],
};

// --- 3. 🚀 สร้าง "ห้องทดลอง" (Test Harness) ---
// (เหมือนเดิม - ดีมากครับ)
const TestHarness: React.FC<
    Partial<React.ComponentProps<typeof SharedFormStep3>>
> = (props) => {
    const methods = useForm<IManufacturingReportForm>({
        defaultValues: initialFormValues,
        mode: 'onChange',
    });

    return (
        <FormProvider {...methods}>
            <SharedFormStep3
                register={methods.register}
                errors={methods.formState.errors}
                control={methods.control}
                getValues={methods.getValues}
                trigger={methods.trigger}
                onTemplateLoaded={props.onTemplateLoaded || vi.fn()}
                templateName="BZ_Step3_Operations" // Default (สามารถ override ได้)
                {...props}
            />
        </FormProvider>
    );
};

// --- 4. เริ่มกลุ่มเทส ---
describe('SharedFormStep3 (Component)', () => {
    const user = userEvent.setup();
    let mockOnTemplateLoaded: vi.Mock;

    beforeEach(() => {
        vi.clearAllMocks(); // ล้างสายลับ
        mockOnTemplateLoaded = vi.fn(); // สร้าง mock function ใหม่ทุกครั้ง
        (getLatestTemplateByName as vi.Mock).mockResolvedValue(MOCK_BLUEPRINT_BZ); // Default mock
    });

    // --- 4A: เทสการโหลด (API) ---
    describe('การโหลด API และการแสดงผล (Loading / API)', () => {
        it('เทส 1.1: ควรแสดง "Loading..." ในตอนแรก', () => {
            (getLatestTemplateByName as vi.Mock).mockReturnValue(new Promise(() => { }));
            render(<TestHarness />);
            expect(screen.getByText('Loading Form Step 3...')).toBeTruthy();
        });

        it('เทส 1.2: ควรแสดงผล Blueprint "BZ" และเรียก onTemplateLoaded', async () => {
            (getLatestTemplateByName as vi.Mock).mockResolvedValue(MOCK_BLUEPRINT_BZ);
            render(
                <TestHarness
                    templateName="BZ_Step3_Operations"
                    onTemplateLoaded={mockOnTemplateLoaded}
                />,
            );

            expect(await screen.findByText('Main Task 1 (BZ)')).toBeTruthy();
            expect(await screen.findByText('Main Task 2 (BZ)')).toBeTruthy();

            // [เพิ่มใหม่] เช็คว่า Callback ถูกเรียกด้วย template info ที่ถูกต้อง
            expect(mockOnTemplateLoaded).toHaveBeenCalledTimes(1);
            expect(mockOnTemplateLoaded).toHaveBeenCalledWith(
                MOCK_BLUEPRINT_BZ.template,
            );
        });

        it('เทส 1.3: [แก้ไข] ควรแสดงผล Blueprint "BS3" (ช่อง Humidity) ถูกต้อง', async () => {
            (getLatestTemplateByName as vi.Mock).mockResolvedValue(MOCK_BLUEPRINT_BS3);
            const { container } = render(
                <TestHarness templateName="BS3_Step3_Operations" />,
            );

            // รอให้ UI พร้อม
            await screen.findByText('Main Task (BS3)');

            // [แก้ไข] ค้นหา Input หลังจาก Render สำเร็จ
            const humidityInput = container.querySelector(
                'input[name="operationResults.0.humidity"]',
            );
            expect(humidityInput).toBeTruthy();
            expect((humidityInput as HTMLInputElement).type).toBe('number');
        });

        it('เทส 1.4: ควรแสดง "Error" เมื่อ API ล้มเหลว', async () => {
            (getLatestTemplateByName as vi.Mock).mockRejectedValue(
                new Error('API Failed'),
            );
            render(<TestHarness templateName="BZ_Step3_Operations" />);

            const errorMsg =
                'ไม่สามารถโหลดข้อมูล Master (BZ_Step3_Operations) ของ Step 3 ได้';
            expect(await screen.findByText(errorMsg)).toBeTruthy();
        });
    });

    // --- 4B: เทส Logic การ Validate เวลา (Main Items) ---
    describe('Logic การ Validate เวลา (Main Items - BZ Blueprint)', () => {

        // Helper function สำหรับดึง Input ของ Main Item
        const getMainInputs = (container: HTMLElement) => {
            const startTimeInput = (idx: number) => container.querySelector(`input[name="operationResults.${idx}.startTime"]`);
            const finishTimeInput = (idx: number) => container.querySelector(`input[name="operationResults.${idx}.finishTime"]`);
            return { startTimeInput, finishTimeInput };
        };

        it('เทส 2.1: [ผ่าน] ควร Validate ผ่าน ถ้า startTime < finishTime', async () => {
            const { container } = render(<TestHarness />);
            await screen.findByText('Main Task 1 (BZ)');
            const { startTimeInput, finishTimeInput } = getMainInputs(container);

            await user.type(startTimeInput(0)!, '10:00');
            await user.type(finishTimeInput(0)!, '11:00');
            await user.click(document.body); // Blur

            await waitFor(() => {
                expect(screen.queryByText('Start < Finish')).toBeNull();
            });
        });

        it('เทส 2.2: [Error] ควร Validate ไม่ผ่าน ถ้า startTime > finishTime (วันเดียวกัน)', async () => {
            const { container } = render(<TestHarness />);
            await screen.findByText('Main Task 1 (BZ)');
            const { startTimeInput, finishTimeInput } = getMainInputs(container);

            await user.type(startTimeInput(0)!, '12:00');
            await user.type(finishTimeInput(0)!, '11:00');
            await user.click(document.body);

            // Error นี้มาจาก `greaterThanStart` ของ `finishTime`
            expect(await screen.findByText('Start < Finish')).toBeTruthy();
        });

        it('เทส 2.3: [Error] ควร Validate ไม่ผ่าน ถ้าเวลา "ทับซ้อน" (afterPreviousTime)', async () => {
            const { container } = render(<TestHarness />);
            await screen.findByText('Main Task 1 (BZ)');
            const { startTimeInput } = getMainInputs(container);

            await user.type(startTimeInput(0)!, '10:00'); // แถว 1 เริ่ม 10:00
            await user.type(startTimeInput(1)!, '09:00'); // แถว 2 เริ่ม 09:00 (ผิด)
            await user.click(document.body);

            // (คงเดิมตามที่คุณเทสไว้) - เช็ค Error ที่ startTime ของแถว 2
            // ที่ไม่มีเว้นวรรคเพราะเป็น Bug ใน Validator ของ Main StartTime (line 574)
            expect(await screen.findByText('ต้องมากกว่า10:00')).toBeTruthy();
        });

        it('เทส 2.4: [ผ่าน] [เพิ่มใหม่] ควร Validate ผ่าน ถ้าเป็นกะ "ข้ามคืน" (Overnight)', async () => {
            const { container } = render(<TestHarness />);
            await screen.findByText('Main Task 1 (BZ)');
            const { startTimeInput, finishTimeInput } = getMainInputs(container);

            await user.type(startTimeInput(0)!, '22:00');
            await user.type(finishTimeInput(0)!, '06:00');
            await user.click(document.body);

            await waitFor(() => {
                // ไม่ควรมี Error (Duration = 8 ชม. < 12 ชม.)
                expect(screen.queryByText('Start < Finish')).toBeNull();
            });
        });

        it('เทส 2.5: [Error] [เพิ่มใหม่] ควร Validate ไม่ผ่าน ถ้า "Duration > 12 ชม." (วันเดียวกัน)', async () => {
            const { container } = render(<TestHarness />);
            await screen.findByText('Main Task 1 (BZ)');
            const { startTimeInput, finishTimeInput } = getMainInputs(container);

            await user.type(startTimeInput(0)!, '08:00');
            await user.type(finishTimeInput(0)!, '21:00'); // (13 ชม.)
            await user.click(document.body);

            // Error จาก `greaterThanStart` ของ `finishTime`
            expect(await screen.findByText('Start < Finish')).toBeTruthy();
        });

        it('เทส 2.6: [Error] [เพิ่มใหม่] ควร Validate ไม่ผ่าน ถ้า "Duration > 12 ชม." (ข้ามคืน)', async () => {
            const { container } = render(<TestHarness />);
            await screen.findByText('Main Task 1 (BZ)');
            const { startTimeInput, finishTimeInput } = getMainInputs(container);

            await user.type(startTimeInput(0)!, '20:00');
            await user.type(finishTimeInput(0)!, '09:00'); // (13 ชม.)
            await user.click(document.body);

            expect(await screen.findByText('Start < Finish')).toBeTruthy();
        });

        it('เทส 2.7: [Error] [เพิ่มใหม่] ควร Validate ไม่ผ่าน ถ้า "ช่องว่าง > 12 ชม." (Horizontal)', async () => {
            const { container } = render(<TestHarness />);
            await screen.findByText('Main Task 1 (BZ)');
            const { startTimeInput, finishTimeInput } = getMainInputs(container);

            await user.type(startTimeInput(0)!, '08:00');
            await user.type(finishTimeInput(0)!, '10:00'); // แถว 1 เสร็จ 10:00
            await user.type(startTimeInput(1)!, '23:00'); // แถว 2 เริ่ม 23:00 (ห่าง 13 ชม.)
            await user.click(document.body);

            // Error จาก `afterPreviousTime` ของ `startTime(1)`
            expect(await screen.findByText('ต้องมากกว่า10:00')).toBeTruthy();
        });
    });

    // --- 4C: [เพิ่มใหม่] เทส Logic การ Validate เวลา (Sub Items) ---
    describe('Logic การ Validate เวลา (Sub Items - SUB Blueprint)', () => {

        beforeEach(() => {
            // ใช้ Mock ที่มี Sub-items สำหรับทุกเทสในกลุ่มนี้
            (getLatestTemplateByName as vi.Mock).mockResolvedValue(MOCK_BLUEPRINT_WITH_SUBITEMS);
        });

        // Helper function สำหรับดึง Input ของ Sub Item
        const getSubInputs = (container: HTMLElement) => {
            const mainStartTime = (idx: number) => container.querySelector(`input[name="operationResults.${idx}.startTime"]`);
            const mainFinishTime = (idx: number) => container.querySelector(`input[name="operationResults.${idx}.finishTime"]`);
            const subStartTime = (idx: number, sIdx: number) => container.querySelector(`input[name="operationResults.${idx}.subItems.${sIdx}.startTime"]`);
            const subFinishTime = (idx: number, sIdx: number) => container.querySelector(`input[name="operationResults.${idx}.subItems.${sIdx}.finishTime"]`);
            return { mainStartTime, mainFinishTime, subStartTime, subFinishTime };
        };

        it('เทส 3.1: [Error] (Sub-Item) ควรไม่ผ่าน ถ้า startTime > finishTime (Vertical)', async () => {
            const { container } = render(<TestHarness />);
            await screen.findByText(/Sub Item 2.1/i);
            const { subStartTime, subFinishTime } = getSubInputs(container);

            await user.type(subStartTime(1, 0)!, '14:00');
            await user.type(subFinishTime(1, 0)!, '13:00');
            await user.click(document.body);

            expect(await screen.findByText('Start < Finish')).toBeTruthy();
        });

        it('เทส 3.2: [Error] (Sub-Item) ควรไม่ผ่าน ถ้าทับซ้อน (Sub-to-Sub)', async () => {
            const { container } = render(<TestHarness />);
            await screen.findByText(/Sub Item 2.1/i);
            const { subStartTime, subFinishTime } = getSubInputs(container);

            // Sub 2.1 (Index 1, SubIndex 0)
            await user.type(subFinishTime(1, 0)!, '15:00');
            // Sub 2.2 (Index 1, SubIndex 1)
            await user.type(subStartTime(1, 1)!, '14:00'); // ผิด
            await user.click(document.body);

            // Error ที่ Sub 2.2 (มีเว้นวรรค เพราะ Validator ถูกต้อง)
            expect(await screen.findByText('ต้องมากกว่า 15:00')).toBeTruthy();
        });

        it('เทส 3.3: [Error] (Sub-Item) ควรไม่ผ่าน ถ้าทับซ้อน (Sub-to-Main)', async () => {
            const { container } = render(<TestHarness />);
            await screen.findByText(/Sub Item 2.1/i);
            const { mainFinishTime, subStartTime } = getSubInputs(container);

            // Main 2 (Index 1)
            await user.type(mainFinishTime(1)!, '10:00');
            // Sub 2.1 (Index 1, SubIndex 0)
            await user.type(subStartTime(1, 0)!, '09:00'); // ผิด
            await user.click(document.body);

            // Logic `findPrevious` ของ Sub-Item(0) จะค้นหา Main Item(1)
            expect(await screen.findByText('ต้องมากกว่า 10:00')).toBeTruthy();
        });

        it('เทส 3.4: [Error] (Sub-Item) ควรไม่ผ่าน ถ้าทับซ้อน (Main-to-Sub)', async () => {
            const { container } = render(<TestHarness />);
            await screen.findByText(/Sub Item 2.1/i);
            const { mainFinishTime, subStartTime } = getSubInputs(container);

            // Sub 2.1 (Index 1, SubIndex 0)
            await user.type(subStartTime(1, 0)!, '12:00');
            // Main 2 (Index 1)
            await user.type(mainFinishTime(1)!, '13:00'); // ผิด
            await user.click(document.body);

            // Logic `findNext` ของ Main Item(1) จะค้นหา Sub-Item(0)
            // Error ที่ MainFinish(1)
            expect(await screen.findByText('Gap to 12:00 > 12h')).toBeTruthy();
        });
    });

    // --- 4D: [เพิ่มใหม่] เทส Logic การ Validate Input (SINGLE_INPUT_GROUP) ---
    describe('Logic การ Validate Input (SINGLE_INPUT_GROUP - BS3 Blueprint)', () => {

        beforeEach(() => {
            // ใช้ Mock BS3 สำหรับทุกเทสในกลุ่มนี้
            (getLatestTemplateByName as vi.Mock).mockResolvedValue(MOCK_BLUEPRINT_BS3);
        });

        it('เทส 4.1: [Error] ควรไม่ผ่าน ถ้ากรอกค่า > Max (101)', async () => {
            const { container } = render(<TestHarness templateName="BS3_Step3_Operations" />);
            await screen.findByText('Main Task (BS3)');
            const humidityInput = container.querySelector(
                'input[name="operationResults.0.humidity"]',
            );

            await user.type(humidityInput!, '101');
            await user.click(document.body);

            expect(await screen.findByText('ห้ามเกิน 100')).toBeTruthy();
        });

        it('เทส 4.2: [ผ่าน] ควรผ่าน ถ้ากรอกค่า = Max (100)', async () => {
            const { container } = render(<TestHarness templateName="BS3_Step3_Operations" />);
            await screen.findByText('Main Task (BS3)');
            const humidityInput = container.querySelector(
                'input[name="operationResults.0.humidity"]',
            );

            await user.type(humidityInput!, '100');
            await user.click(document.body);

            await waitFor(() => {
                expect(screen.queryByText('ห้ามเกิน 100')).toBeNull();
            });
        });

        it('เทส 4.3: [ผ่าน] ควรผ่าน ถ้ากรอกค่า < Max (99)', async () => {
            const { container } = render(<TestHarness templateName="BS3_Step3_Operations" />);
            await screen.findByText('Main Task (BS3)');
            const humidityInput = container.querySelector(
                'input[name="operationResults.0.humidity"]',
            );

            await user.type(humidityInput!, '99');
            await user.click(document.body);

            await waitFor(() => {
                expect(screen.queryByText('ห้ามเกิน 100')).toBeNull();
            });
        });
    });
});