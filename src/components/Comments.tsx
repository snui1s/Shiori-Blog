import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { validateCommentContent } from "../lib/comments";
import { getOptimizedImageUrl } from "../lib/images";
import type { Comment } from "../types";

interface CommentsProps {
  postId: number;
  session: any;
  currentUser: any;
  isAdmin: boolean;
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  depth: number;
  session: any;
  currentUser: any;
  isAdmin: boolean;
  replyTo: number | null;
  setReplyTo: (id: number | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  handleSubmit: (
    e: React.SyntheticEvent<HTMLFormElement>,
    parentId: number | null,
  ) => Promise<void>;
  handleDelete: (commentId: number) => Promise<void>;
  loading: boolean;
  index: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isReply = false,
  depth,
  session,
  currentUser,
  isAdmin,
  replyTo,
  setReplyTo,
  replyContent,
  setReplyContent,
  handleSubmit,
  handleDelete,
  loading,
  index,
}) => {
  const isAuthor = comment.isAuthor || (currentUser?.id && comment.userId && currentUser.id === comment.userId);
  const canDelete = comment.canDelete !== undefined ? comment.canDelete : (isAuthor || isAdmin);

  return (
    <div
      className={`flex flex-col gap-3 reveal stagger-${(index % 5) + 1} ${isReply ? 'ml-6 md:ml-12 relative before:content-[""] before:absolute before:-left-4 md:before:-left-6 before:top-0 before:bottom-6 before:w-px before:bg-border' : ""}`}
    >
      <div className="bg-surface border border-border p-5 md:p-6 rounded-2xl flex gap-4 md:gap-5 transition-all duration-300 hover:border-primary/30 shadow-xs group">
        <div className="relative shrink-0">
          <img
            src={
              getOptimizedImageUrl(comment.user.image, 48) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.name)}&background=bc3838&color=fff`
            }
            alt={comment.user.name}
            className="w-10 h-10 md:w-11 md:h-11 rounded-xl object-cover ring-1 ring-border"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.name)}&background=bc3838&color=fff`;
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-bold text-text text-base truncate">
              {comment.user.name}
            </span>
            <span className="text-xs text-text-muted whitespace-nowrap ml-2 uppercase tracking-wider font-medium">
              {new Date(comment.createdAt).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>

          <p className="text-text leading-relaxed text-[0.95rem] mb-3 wrap-break-word whitespace-pre-wrap font-normal">
            {comment.content}
          </p>

          <div className="flex items-center gap-4">
            {session && depth < 1 && (
              <button
                onClick={() =>
                  setReplyTo(replyTo === comment.id ? null : comment.id)
                }
                className="text-xs font-bold text-primary hover:text-secondary transition-colors cursor-pointer"
              >
                {replyTo === comment.id ? "ยกเลิก" : "ตอบกลับ"}
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => {
                  toast(
                    (t) => (
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-text">
                          ต้องการลบความคิดเห็นนี้?
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              toast.dismiss(t.id);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-text hover:bg-surface-subtle transition-colors"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(comment.id);
                              toast.dismiss(t.id);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs"
                          >
                            ลบเลย
                          </button>
                        </div>
                      </div>
                    ),
                    {
                      style: {
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                      },
                      position: "top-center",
                      duration: 5000,
                    },
                  );
                }}
                className="text-text-muted hover:text-red-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="ลบความคิดเห็น"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            )}

            <span className="text-xs text-text-muted/50 font-mono ml-auto">
              #{comment.id}
            </span>
          </div>

          {replyTo === comment.id && (
            <form
              onSubmit={(e) => handleSubmit(e, comment.id)}
              className="mt-4 animate-slide-down"
            >
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`เขียนคำตอบให้ ${comment.user.name}...`}
                className="w-full bg-surface-subtle border border-border rounded-xl p-3 text-text text-sm outline-none focus:border-primary focus:bg-surface transition-all resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end mt-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-secondary text-white px-5 py-1.5 rounded-full font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "..." : "ส่งคำตอบ"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="flex flex-col gap-4">
          {comment.replies.map((reply, idx) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply={true}
              depth={depth + 1}
              session={session}
              currentUser={currentUser}
              isAdmin={isAdmin}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              handleSubmit={handleSubmit}
              handleDelete={handleDelete}
              loading={loading}
              index={idx + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Comments: React.FC<CommentsProps> = ({
  postId,
  session,
  currentUser,
  isAdmin,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const buildCommentTree = (flatComments: any[]) => {
    const map: { [key: number]: Comment } = {};
    const roots: Comment[] = [];

    flatComments.forEach((comment) => {
      map[comment.id] = { ...comment, replies: [] };
    });

    flatComments.forEach((comment) => {
      if (comment.parentId && map[comment.parentId]) {
        map[comment.parentId].replies?.push(map[comment.id]);
      } else {
        roots.push(map[comment.id]);
      }
    });

    return roots;
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(buildCommentTree(data));
        setFetchError(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setFetchError(errorData.error || "ไม่สามารถโหลดความคิดเห็นได้");
      }
    } catch (err) {
      setFetchError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleDelete = async (commentId: number) => {
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("ลบความคิดเห็นสำเร็จ");
        await fetchComments();
      } else {
        const data = await res.json();
        toast.error(data.error || "ลบไม่สำเร็จ");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const handleSubmit = async (
    e: React.SyntheticEvent<HTMLFormElement>,
    parentId: number | null = null,
  ) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;

    const validation = validateCommentContent(content);
    if (!validation.isValid) {
      toast.error(validation.message || "ข้อความไม่ถูกต้อง");
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({ postId, content, parentId }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        toast.success(parentId ? "ตอบกลับสำเร็จ!" : "ส่งความคิดเห็นเรียบร้อย!");
        if (parentId) {
          setReplyContent("");
          setReplyTo(null);
        } else {
          setNewComment("");
        }
        await fetchComments();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "เกิดข้อผิดพลาดในการส่งคอมเมนต์");
      }
    } catch (err) {
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-16 w-full max-w-[800px] mx-auto reveal">
      <div className="flex items-center gap-2.5 mb-8 justify-center">
        <span className="hanko-stamp text-xs">栞</span>
        <h3 className="text-xl md:text-2xl font-extrabold text-text tracking-tight m-0">
          บทสนทนาและความคิดเห็น
        </h3>
      </div>

      {session ? (
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="card-editorial p-5 md:p-6 mb-12 flex flex-col gap-4 relative"
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="ร่วมแสดงความคิดเห็นหรือแบ่งปันมุมมองของคุณ..."
            className="w-full bg-surface-subtle border border-border rounded-xl p-4 text-text text-sm md:text-base outline-none focus:border-primary/40 focus:bg-surface transition-all min-h-[120px] resize-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="self-end bg-primary hover:bg-secondary text-white px-7 py-2.5 rounded-full font-semibold text-sm transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
          </button>
        </form>
      ) : (
        <div className="py-10 px-6 text-center rounded-2xl border border-dashed border-border bg-surface/60 mb-10 flex flex-col items-center gap-1.5">
          <p className="text-text font-medium text-base m-0">
            เข้าสู่ระบบเพื่อร่วมสนทนาและเขียนความคิดเห็น
          </p>
          <span className="text-xs text-text-muted">แบ่งปันเรื่องราวและเชื่อมต่อผ่านตัวอักษร</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {fetchError && (
          <div className="glass-premium p-10 text-center rounded-3xl border border-primary/20">
            <p className="text-primary font-bold mb-4">{fetchError}</p>
            <button
              onClick={() => fetchComments()}
              className="text-white bg-primary px-6 py-2 rounded-full font-bold"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {!fetchError &&
          comments.map((comment, idx) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              session={session}
              currentUser={currentUser}
              isAdmin={isAdmin}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              handleSubmit={handleSubmit}
              handleDelete={handleDelete}
              loading={loading}
              index={idx}
            />
          ))}

        {!fetchError && comments.length === 0 && (
          <div className="text-center py-20 opacity-40 flex flex-col items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-message-square-dashed"
            >
              <path d="M5 3a2 2 0 0 0-2 2" />
              <path d="M19 3a2 2 0 0 1 2 2" />
              <path d="M5 21a2 2 0 0 1-2-2" />
              <path d="M19 21a2 2 0 0 0 2-2" />
              <path d="M9 3h1" />
              <path d="M14 3h1" />
              <path d="M9 21h1" />
              <path d="M14 21h1" />
              <path d="M3 9v1" />
              <path d="M3 14v1" />
              <path d="M21 9v1" />
              <path d="M21 14v1" />
            </svg>
            <p className="text-lg italic">เม้นแรกเป็นของคุณแล้ว</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Comments;
