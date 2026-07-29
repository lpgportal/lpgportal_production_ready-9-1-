import React, { useState } from "react";
import { ARTICLES_DATA } from "../data";
import { Article } from "../types";
import { BookOpen, User, Calendar, Eye, ThumbsUp, Send, MessageSquare } from "lucide-react";

export default function TechnicalBlog() {
  const [activeCategory, setActiveCategory] = useState<string>("Hepsi");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(ARTICLES_DATA[0]?.id || null);
  const [articlesList, setArticlesList] = useState<Article[]>(ARTICLES_DATA);

  // Comment posting states
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("Araç Sahibi");
  const [commentText, setCommentText] = useState("");

  const categories = ["Hepsi", "Teknik Bilgi", "Arıza Çözümleri"];

  const filteredArticles = activeCategory === "Hepsi" 
    ? articlesList 
    : articlesList.filter(art => art.category === activeCategory);

  const selectedArticle = articlesList.find(art => art.id === selectedArticleId) || filteredArticles[0];

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArticlesList(prev => 
      prev.map(art => {
        if (art.id === id) {
          return { ...art, likes: art.likes + 1 };
        }
        return art;
      })
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !commentText || !selectedArticleId) return;

    const newComment = {
      id: "c_" + Date.now(),
      userName,
      userRole,
      comment: commentText,
      created_at: new Date().toISOString().split("T")[0]
    };

    setArticlesList(prev =>
      prev.map(art => {
        if (art.id === selectedArticleId) {
          return {
            ...art,
            comments: [...art.comments, newComment]
          };
        }
        return art;
      })
    );

    setUserName("");
    setCommentText("");
  };

  return (
    <div className="bg-white text-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-100">
          Modül 3: Teknik Bilgi Merkezi & SEO Blog
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
          LPG Teknik Kütüphanesi
        </h2>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto text-sm">
          Makalelerimiz, Türkiye'nin saygın endüstriyel mekatronik mühendisleri ve TSE sızdırmazlık onaylı atölye ustalarının usta bültenleri referans alınarak üretilmiştir.
        </p>
      </div>

      {/* Category selector tags */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-4 overflow-x-auto whitespace-nowrap scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setSelectedArticleId(null);
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeCategory === cat
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-55 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Article List Card Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-205 scrollbar-thumb-slate-200">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArticleId(art.id)}
              className={`p-5 rounded-xl cursor-pointer border transition duration-150 ${
                selectedArticle?.id === art.id
                  ? "bg-emerald-50/70 border-emerald-500 shadow-xs"
                  : "bg-white border-slate-200 hover:bg-slate-50/50 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-center text-[10px] text-emerald-700 font-bold uppercase tracking-wider font-mono mb-2">
                <span>{art.category}</span>
                <span className="text-slate-400">{art.created_at}</span>
              </div>
              <h3 className="font-bold text-base text-slate-900 hover:text-emerald-700 transition mb-1">
                {art.title}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                {art.summary}
              </p>
              
              <div className="flex items-center justify-between text-[11px] text-slate-550 text-slate-500 pt-2 border-t border-slate-150">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 text-slate-400" /> {art.author.split(" ")[1] ? art.author : "Uzman Usta"}
                </span>
                <div className="flex gap-3">
                  <span className="flex items-center gap-0.5">
                    <Eye className="h-3 w-3" /> {art.views}
                  </span>
                  <button 
                    onClick={(e) => handleLike(art.id, e)}
                    className="flex items-center gap-0.5 text-slate-500 hover:text-emerald-700 transition cursor-pointer"
                  >
                    <ThumbsUp className="h-3 w-3" /> {art.likes}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Reading Pane (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-6 max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          {selectedArticle ? (
            <div className="space-y-6 animate-fade-in text-slate-800">
              {/* Header */}
              <div className="border-b border-slate-200 pb-4">
                <span className="text-xs text-emerald-700 font-bold tracking-widest uppercase font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedArticle.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-905 text-slate-900 mt-3 font-sans tracking-tight leading-tight">
                  {selectedArticle.title}
                </h1>
                <div className="flex flex-wrap gap-4 items-center gap-2 mt-4 text-xs text-slate-500 text-slate-600">
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{selectedArticle.author} ({selectedArticle.authorTitle})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedArticle.created_at}</span>
                  </div>
                </div>
              </div>

              {/* Core Content */}
              <div className="text-slate-700 text-sm leading-relaxed space-y-4 max-w-none">
                {/* Simple manual rendering of our customized line-breaking markdown blocks */}
                {selectedArticle.content.split("\n\n").map((para, idx) => {
                  if (para.startsWith("###")) {
                    return <h3 key={idx} className="text-lg font-bold text-slate-900 pt-2 border-l-2 border-emerald-500 pl-2">{para.replace("###", "")}</h3>;
                  }
                  if (para.startsWith("####")) {
                    return <h4 key={idx} className="text-base font-semibold text-emerald-700">{para.replace("####", "")}</h4>;
                  }
                  if (para.startsWith("*") || para.startsWith("-")) {
                    return (
                      <ul key={idx} className="list-disc pl-5 space-y-1 block my-2 text-slate-700">
                        {para.split("\n").map((item, i) => (
                          <li key={i}>{item.replace(/^[\*\-]\s+/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (para.match(/^\d+\./)) {
                    return (
                      <ol key={idx} className="list-decimal pl-5 space-y-1 block my-2 text-slate-700">
                        {para.split("\n").map((item, i) => (
                          <li key={i}>{item.replace(/^\d+\.\s+/, "")}</li>
                        ))}
                      </ol>
                    );
                  }
                  return <p key={idx} className="whitespace-pre-line text-slate-655 text-slate-650">{para}</p>;
                })}
              </div>

              {/* Liking Segment */}
              <div className="bg-white p-4 rounded-lg border border-slate-205 border-slate-200 flex items-center justify-between text-xs shadow-xs">
                <span className="text-slate-550 text-slate-500 font-medium">Bu uzman makalesini faydalı buldunuz mu?</span>
                <button
                  onClick={(e) => handleLike(selectedArticle.id, e)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Evet, Beğendim ({selectedArticle.likes})</span>
                </button>
              </div>

              {/* Comments Board */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="font-bold text-lg text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  Makale Yorumları ({selectedArticle.comments.length})
                </h4>

                {/* Post comment form */}
                <form onSubmit={handleAddComment} className="space-y-3 bg-white p-4 rounded-lg border border-slate-200 text-xs shadow-xs">
                  <span className="font-semibold text-emerald-700">Görüş Bildir veya Soru Sor</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Adınız</label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Serdar A."
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded p-1.5 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Rolünüz</label>
                      <select
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded p-1.5 text-xs text-slate-800"
                      >
                        <option value="Araç Sahibi">Araç Sahibi</option>
                        <option value="Ziyaretçi">Ziyaretçi</option>
                        <option value="Firma (Usta)">Firma / Montaj Ustası</option>
                        <option value="Uzman">LPG Mühendisi</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Yorumunuz</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Teknik detaylar, montaj veya markalar ile ilgili sorunuzu buraya yazın..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-705 bg-emerald-600 hover:bg-emerald-750 hover:bg-emerald-700 text-white font-bold p-2 px-3 py-1.5 rounded flex items-center gap-1 text-[11px] transition cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    <span>Yayınla</span>
                  </button>
                </form>

                {/* Comment listing */}
                <div className="space-y-3 divide-y divide-slate-150">
                  {selectedArticle.comments.map((comm) => (
                    <div key={comm.id} className="pt-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{comm.userName}</span>
                          <span className="bg-slate-100 text-slate-655 text-slate-600 text-[9px] px-1.5 py-0.5 rounded uppercase font-mono border border-slate-200/50">
                            {comm.userRole}
                          </span>
                        </div>
                        <span className="text-slate-400">{comm.created_at}</span>
                      </div>
                      <p className="text-slate-655 text-slate-600 text-xs pl-2 border-l-2 border-slate-200">{comm.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-slate-400">
              Lütfen okumak için soldan bir başlık seçin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
