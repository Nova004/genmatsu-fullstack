// frontend/src/components/formGen/components/ApprovalFlowDisplay.tsx

import React, { useState, useEffect } from "react";
import { getApprovalFlowBySubmissionId, performApprovalAction, } from "../../../../services/approvalService"; // (Service ที่เราเพิ่งสร้าง)
import { IApprovalFlowStep } from "../../pages/types"; // (Type ที่เราเพิ่งสร้าง)
import Loader from "../../../../common/Loader"; // (ใช้ Loader ที่มีอยู่)
import { useAuth } from "../../../../context/AuthContext"; // 👈 2. [เพิ่ม] Import useAuth
import { fireToast } from "../../../../hooks/fireToast"; // 👈 3. [เพิ่ม] Import fireToast

interface Props {
  submissionId: number;
}

// ฟังก์ชันผู้ช่วยสำหรับ "ตั้งชื่อ" Level
const getLevelName = (level: number) => {
  switch (level) {
    case 1:
      return "Shift Leader";
    case 2:
      return "Sr. Staff";
    case 3:
      return "Supervisor";
    default:
      return `Level ${level}`;
  }
};

// ฟังก์ชันผู้ช่วยสำหรับ "สี" และ "ไอคอน" ของสถานะ
const getStatusAttributes = (status: IApprovalFlowStep["status"]) => {
  switch (status) {
    case "Approved":
      return {
        className: "text-success bg-success/10",
        icon: "✓", // Checkmark
      };
    case "Rejected":
      return {
        className: "text-danger bg-danger/10",
        icon: "✕", // Cross
      };
    case "Pending":
    default:
      return {
        className: "text-warning bg-warning/10",
        icon: "…", // Ellipsis
      };
  }
};
const ApprovalFlowDisplay: React.FC<Props> = ({ submissionId }) => {
  const { user } = useAuth(); // 👈 4. [เพิ่ม] ดึงข้อมูล User ที่ Login อยู่
  const [flowSteps, setFlowSteps] = useState<IApprovalFlowStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 👈 5. [เพิ่ม] State สำหรับปุ่มกด
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState("");

  // 👈 6. [เพิ่ม] ตัวแปร "สถานะปัจจุบัน"
  // (หา "ขั้นแรก" ที่ยัง Pending)
  const currentStep = flowSteps.find((step) => step.status === "Pending");
  // (ตรวจสอบว่า User ที่ Login มีสิทธิ์อนุมัติขั้นนี้หรือไม่)
  const canApprove =
    user && currentStep && user.LV_Approvals === currentStep.required_level;

  // ฟังก์ชันดึงข้อมูล (เราจะแยกมันออกมา)
  const fetchFlow = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getApprovalFlowBySubmissionId(submissionId);
      setFlowSteps(data);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลการอนุมัติได้");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!submissionId) return;
    fetchFlow();
  }, [submissionId]);

  // 👈 7. [เพิ่ม] ฟังก์ชันสำหรับ "กดปุ่ม"
  const handleAction = async (action: "Approved" | "Rejected") => {
    if (!user || !currentStep) return; // (ปุ่มไม่ควรจะถูกแสดงอยู่แล้ว)

    if (action === "Rejected" && !comment.trim()) {
      fireToast("error", "กรุณากรอกเหตุผลในช่อง Comment ก่อน Reject");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        submissionId: submissionId,
        action: action,
        comment: comment,
        approverUserId: user.id, // ส่ง ID ของ "ผู้กด"
      };

      // ยิง API "กระทำ"
      await performApprovalAction(payload);

      fireToast("success", `ดำเนินการ ${action} สำเร็จ!`);
      setComment(""); // ล้าง comment
      fetchFlow(); // 👈 ดึงข้อมูล Flow ใหม่ทันที

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "เกิดข้อผิดพลาด";
      fireToast("error", `ดำเนินการไม่สำเร็จ: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // (Loading, Error, No Flow ... เหมือนเดิม ...)
  if (isLoading) return <Loader />;
  if (error) return <div className="text-danger">{error}</div>;
  if (flowSteps.length === 0) {
    // ... (เหมือนเดิม)
  }

  // (Return หลัก - ฉบับอัปเกรด)
  return (
    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h4 className="mb-4 text-lg font-semibold text-black dark:text-white">
        สถานะการอนุมัติ (Approval Flow)
      </h4>

      <div className="flex flex-col gap-4">
        {flowSteps.map((step) => {
          const statusAttrs = getStatusAttributes(step.status);
          return (
            <div key={step.flow_id} className="flex items-center gap-3">
              {/* ส่วนแสดง ไอคอน และ สี */}
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${statusAttrs.className}`}
              >
                {statusAttrs.icon}
              </div>

              {/* ส่วนแสดง ข้อความ */}
              <div>
                <p className="font-medium text-black dark:text-white">
                  {getLevelName(step.required_level)}
                </p>
                <p className={`text-sm ${statusAttrs.className}`}>
                  {step.status === "Approved"
                    ? `อนุมัติโดย: ${step.approver_name || "N/A"}`
                    : step.status === "Rejected"
                      ? `ปฏิเสธโดย: ${step.approver_name || "N/A"}`
                      : "รอดำเนินการ"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🚀 8. [ใหม่] แสดงปุ่มกด ถ้ามีสิทธิ์ (canApprove) */}
      {canApprove && (
        <div className="mt-6 border-t border-stroke pt-4 dark:border-strokedark">
          <h5 className="mb-2 font-medium">
            ดำเนินการอนุมัติ (สำหรับ {getLevelName(currentStep.required_level)})
          </h5>

          {/* ช่อง Comment */}
          <textarea
            rows={3}
            placeholder="Comment (จำเป็น หาก Reject)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          ></textarea>

          {/* ปุ่ม Approve / Reject */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleAction("Rejected")}
              disabled={isSubmitting}
              className="flex justify-center rounded bg-danger px-6 py-2 font-medium text-gray hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "กำลังส่ง..." : "Reject"}
            </button>
            <button
              onClick={() => handleAction("Approved")}
              disabled={isSubmitting}
              className="flex justify-center rounded bg-success px-6 py-2 font-medium text-gray hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "กำลังส่ง..." : "Approve"}
            </button>
          </div>
        </div>
      )}

      {/* 🚀 9. [ใหม่] แสดงข้อความ ถ้าอนุมัติครบ/Reject แล้ว */}
      {!currentStep && (
        <div className="mt-4 border-t border-stroke pt-4 dark:border-strokedark">
          <p className="font-medium text-black dark:text-white">
            {flowSteps[flowSteps.length - 1]?.status === "Approved"
              ? "การอนุมัติเสร็จสมบูรณ์แล้ว"
              : "เอกสารถูกปฏิเสธ"}
          </p>
        </div>
      )}

    </div>
  );
};

export default ApprovalFlowDisplay;