'use strict';
/* =====================================================================
   鳴ってはいけない教室  ― IBS(過敏性腸症候群)への理解を目的とした心理ホラーADV
   ・index.html / style.css / script.js だけで動作(GitHub Pages対応)
   ・上半分 = データ(シナリオ・診断・エンディング)  下半分 = エンジン
   ・登場人物の名前は下の A_NAME / B_NAME を書き換えるだけで変更できます
   ===================================================================== */
const A_NAME = 'A';   // IBSを抱える高校生
const B_NAME = 'B';   // もう一人の登場人物

/* =====================================================================
   DATA : 診断
   y = 「はい」を選んだ時の色 / n = 「いいえ」の時の色  (g=🟢 r=🔴)
   ===================================================================== */
const QUIZ = [
  { t: '友達が髪型を変えたり、体調が悪そうだったりするとき、すぐに気づく方だ。', y: 'g', n: 'r' },
  { t: 'テスト中や静かな授業中、「お腹が鳴ったらどうしよう」と不安になったことがある。', y: 'g', n: 'r' },
  { t: '正直、「学校を体調不良でよく休む人」を見ると、「ずるいな」と思ってしまう瞬間がある。', y: 'r', n: 'g' },
  { t: '人前で発表するときや緊張する場面でも、あまりお腹が痛くなったりはしない。', y: 'r', n: 'g' },
  { t: 'もし自分が大失敗をして周りからクスクス笑われたら、何日も引きずってしまうと思う。', y: 'g', n: 'r' },
];
/* 🔴4つ以上 → bad / 🟢4つ以上 → A / 🟢3つ → v1 / 🔴3つ → v2 */
function routeFrom(g, r) {
  if (r >= 4) return 'bad';
  if (g >= 4) return 'A';
  return g >= 3 ? 'v1' : 'v2';
}
const ROUTE_INFO = {
  bad: { name: 'もう一度、笑って', sub: '【バッドエンド・ルート】' },
  A:   { name: 'Aの物語',         sub: '【A主体・救われるルート】' },
  v1:  { name: 'シナリオ ver.1',   sub: '【Bに突然おとずれる変化】' },
  v2:  { name: 'シナリオ ver.2',   sub: '【あまり親しくないクラスメイト】' },
};
const RESULT_TEXT = {
  bad: 'あなたは、ほかの人の「見えない苦しさ」を、まだあまり想像したことがないのかもしれません。\nこの先は、少し怖い物語です。驚かせる演出があります。心の準備はいいですか？',
  A:   'あなたは、見えない不安や苦しさに、そっと気づける人のようです。\nこの先は、ある一人の高校生の物語です。',
  v1:  'あなたは、人の変化に気づけるやさしさと、「まだ知らないこと」の両方を持っているようです。\nこの先は、ごく普通の高校生に起こる、ある変化の物語です。',
  v2:  'あなたは、ものごとを客観的に見られる人のようです。ただ、相手の事情までは、まだ見えていないかもしれません。\nこの先は、ある教室で起きる、小さな誤解の物語です。',
};

/* =====================================================================
   DATA : エンディング
   ===================================================================== */
const NOTE_COMMON = 'この作品は、IBS(過敏性腸症候群)など「見えにくい不調」への理解を目的としたフィクションです。診断や治療のための情報ではありません。';
const NOTE_HELP = NOTE_COMMON + '\nもし、あなた自身がつらさを抱えているなら、ひとりで抱え込まず、家族・学校の先生や保健室、医療機関などに相談してみてください。';
const ENDINGS = {
  bad_cold: { name: 'クスクスの教室', kind: 'bad', retry: false,
    lines: ['笑われた人の気持ちは、笑った人には、なかなか届かない。',
            '「ずるいな」のひとことで、誰かの教室は、出口のない場所になる。',
            '——あなたは今、その教室の中にいる。'],
    note: NOTE_COMMON + '\n現実の教室でも、見えない不調を抱える人は「笑われるかもしれない不安」と毎日向き合っていることがあります。' },
  a_saved: { name: 'ここにいていい', kind: 'good', retry: false,
    lines: ['症状が、すっかり消えたわけじゃない。',
            'でも、わたしの教室には「出口」ができた。',
            '出ていってもいい。戻ってきてもいい。',
            'わたしは、もう、ひとりじゃない。'],
    note: NOTE_HELP },
  v1_bad: { name: 'ひとりの教室', kind: 'bad', retry: true,
    lines: ['言えないまま、季節だけが変わっていった。',
            '席に座っているだけで、息が苦しい。教室が、少しずつ遠くなっていく。',
            '本当は、誰かに話せていたら、違ったのかもしれない。'],
    note: NOTE_HELP },
  v1_happy: { name: 'ひとりじゃなかった', kind: 'good', retry: false,
    lines: ['症状がすぐに消えたわけじゃない。',
            'でも、「ひとりで抱え込まなくていい」と知っただけで、教室は少しだけ、怖くなくなった。',
            '今日も、二人でお弁当を広げる。'],
    note: NOTE_HELP },
  v1_true: { name: '気づける人になる', kind: 'true', retry: false,
    lines: ['支えられた人は、いつか、誰かの苦しさに気づける人になる。',
            'あの日、{A}が「私も。」と言ってくれたように。',
            '今度は、わたしの番だった。'],
    note: NOTE_HELP },
  v2_bad_assume: { name: '知ったつもり', kind: 'bad', retry: true,
    lines: ['「わかるよ」と言うのは、かんたんだった。',
            'でも、わたしが知っていたのは、自分の苦しさだけ。',
            '知ったつもりになったとき、人の話を聞く入り口は、閉じてしまう。'],
    note: NOTE_COMMON },
  v2_bad_lie: { name: 'ごまかしの代償', kind: 'bad', retry: true,
    lines: ['「そんなことしてないよ」',
            'その言葉で、{A}の目から、すっと光が消えた。',
            '陰で言った言葉は、いつか、本人に届く。'],
    note: NOTE_COMMON },
  v2_bad_laugh: { name: '変わらない教室', kind: 'bad', retry: true,
    lines: ['話を聞いたはずなのに、わたしは、みんなと一緒に笑った。',
            '知っているのに、行動しない。それは、知らないままよりも、ずっと重いのかもしれない。',
            '{A}の席は、今日も静かだった。'],
    note: NOTE_COMMON },
  v2_happy: { name: '聞くことから', kind: 'good', retry: false,
    lines: ['相手の事情は、本人の口から聞いて、はじめてわかる。',
            '{A}と話すようになって、教室の景色が、少しだけ変わった。'],
    note: NOTE_COMMON },
  v2_true: { name: '事情を知ろうとする人', kind: 'true', retry: false,
    lines: ['「事情があるのかもしれないよ」',
            'そのひとことで、教室の空気が、ほんの少し変わった。',
            '知らないまま判断しない。それは、誰かの居場所を守る力になる。'],
    note: NOTE_COMMON },
};
const ENDING_ORDER = ['bad_cold', 'a_saved', 'v1_bad', 'v1_happy', 'v1_true', 'v2_bad_assume', 'v2_bad_lie', 'v2_bad_laugh', 'v2_happy', 'v2_true'];

/* =====================================================================
   DATA : シナリオ
   beat のキー:
     t 本文 / w 話者 / L ラベル / go 次のラベル(省略=次の行)
     c 選択肢[{t,go,e,s,set}] / e 理解度+ / s 緊張+ / ss 緊張=
     bg 背景 / sc 背景の演出フラグ / ch キャラ配列 / tint 色味
     fx 演出(shake flash glitch rumble whisper giggle sting chime knock soft)
     chap 章タイトル / set フラグ / jif [条件関数,ラベル] / cp チェックポイント / end エンディングID
   ===================================================================== */

/* ---------- 🔴 バッドエンド・ルート (主人公=あなた) ---------- */
const BAD_ROUTE = [
  { chap: '一　いつもの教室', bg: 'classroom', sc: { crowd: true }, ch: [], ss: 15, t: '昼休みのあとの教室。ざわざわした、いつもの空気。' },
  { ch: [{ k: 'A', x: 236, f: 'blank' }], t: 'また、{A}が席を立った。今日だけで、もう三回目だ。' },
  { w: 'クラスメイト', fx: 'giggle', t: 'またトイレ？ずるくない？' },
  { t: '……あなたは、どうする？', c: [
      { t: '「ほんとそれ」と笑う', go: 'b_laugh', set: { laugh: true } },
      { t: '何も言わず、ノートに目を落とす', go: 'b_silent' } ] },
  { L: 'b_laugh', t: 'あなたも笑った。みんなと同じように。それが、いちばん楽だったから。', go: 'b_m1' },
  { L: 'b_silent', t: '何も言わなかった。でも、心のどこかで、同じことを思っていた。' },
  { L: 'b_m1', t: '（体調不良って言えば、授業を抜けられるんだもんな。ずるいな）' },
  { ch: [{ k: 'A', x: 236, f: 'blank' }], t: '戻ってきた{A}と、一瞬、目が合った。' },
  { fx: 'sting', t: '{A}の顔には、何の表情もなかった。ただ、静かに、あなたを見ていた。' },
  { t: '気にも留めず、あなたは窓の外に目をそらした。' },

  { chap: '二　静けさ', bg: 'classroom', sc: { crowd: true }, ch: [], ss: 35, t: '五限目。教科書を読む先生の声だけが、教室に響いている。' },
  { t: '時計の秒針の音が、やけに大きい。' },
  { fx: 'rumble', s: 25, t: '……ぐる。' },
  { t: 'あなたの、お腹だった。' },
  { w: 'あなた', t: '（え……？ 今まで、一度もこんなことなかったのに）', c: [
      { t: '立ち上がって、教室を出る', go: 'b_run' },
      { t: 'じっと、耐える', go: 'b_hold' } ] },
  { L: 'b_run', fx: 'shake', t: '立ち上がった瞬間、椅子が床をこすって、大きな音を立てた。全員が、こちらを見た。', go: 'b_m2' },
  { L: 'b_hold', fx: 'rumble', t: '耐えようとすればするほど、お腹は、大きな音を立てた。' },
  { L: 'b_m2', fx: 'whisper giggle', s: 30, sc: { eyes: true }, tint: 'red', t: '……くすくす。' },
  { w: 'クラスメイト', t: '「いまの、なに？」「オナラ？」「うわ」' },
  { w: 'あなた', t: 'ちがう。ちがうのに——' },
  { fx: 'sting', w: '？？？', t: 'ずるいな。' },
  { t: 'それは、あなたが今日、言った言葉だった。' },

  { chap: '三　終わらない廊下', bg: 'corridor', sc: { loop: true }, ch: [], ss: 70, t: '逃げるように、教室を飛び出した。' },
  { t: 'トイレまでの廊下が、終わらない。走っても、走っても、同じドア、同じ窓が流れていく。' },
  { fx: 'whisper', ch: [{ k: 'shadow', x: 262, s: 1.7 }], t: 'うしろから、足音がついてくる。' },
  { w: '？？？', t: 'ずるいな。ずるいな。ずるいな。' },
  { t: 'それは、あなた自身の声だった。' },
  { sc: { loop: false, occupied: true }, ch: [], t: 'ようやく、突き当たりにトイレが見えた。ドアには「使用中」の札。' },
  { fx: 'knock', t: 'コン、コン、コン。……返事は、ない。' },
  { fx: 'glitch whisper', w: '？？？', t: '……またトイレ？' },
  { t: 'ドアの向こうから聞こえたのも、あなたの声だった。' },

  { chap: '四　出口のない教室', bg: 'classroom', sc: { crowd: true, eyes: true, grin: true, nodoor: true }, tint: 'red', ch: [], ss: 100, fx: 'sting glitch', t: '気づくと、教室に立っていた。ドアは、どこにもない。壁だけが、ある。' },
  { fx: 'whisper', t: '全員が、あなたを見ている。目も、口も、笑ったまま。' },
  { w: 'みんな', t: '「どうしたの？」「ふつうに、してられないの？」「ずるいな」' },
  { t: '声が重なって、ひとつの音になる。……あなたは、どうする？', c: [
      { t: '「ごめんなさい」と謝る', go: 'b_sorry' },
      { t: '「やめて」と叫ぶ', go: 'b_scream' },
      { t: '目を閉じる', go: 'b_close' } ] },
  { L: 'b_sorry', t: '「ごめんなさい」……誰に？何に？ 声は、教室の空気に溶けて消えた。', go: 'b_m3' },
  { L: 'b_scream', fx: 'rumble', t: '叫んだはずの声は、出なかった。かわりに、お腹が、ぐるる、と鳴った。くすくす。くすくす。', go: 'b_m3' },
  { L: 'b_close', t: '目を閉じても、くすくすは、耳の中で鳴り続けた。' },
  { L: 'b_m3', ch: [{ k: 'A', x: 236, f: 'sad' }], tint: 'red', t: '窓際の席に、{A}が座っていた。静かで、かなしい顔だった。' },
  { fx: 'whisper', w: '{A}', t: '……わたしは、毎日、これだったよ。' },
  { w: '{A}', t: 'あなたは、ずっと、笑ってたね。' },
  { bg: 'black', ch: [], ss: 60, fx: 'chime', t: 'チャイムが鳴った。' },
  { t: '誰も、立ち上がらない。あなたの席は、教室のまん中にある。' },
  { t: 'そこから出る方法を、あなたは、もう、知らない。' },
  { end: 'bad_cold' },
];

/* ---------- 🟢 A主体ルート (主人公=A) ---------- */
const A_ROUTE = [
  { chap: '第一章　校門の前で', bg: 'street', ch: [], ss: 30, t: '朝。校門の前で、足が止まった。' },
  { t: 'いつもと同じ景色のはずなのに、そこだけ空気が重い。' },
  { s: 10, t: 'お腹の奥が、きゅうっと縮む。まだ、何も起きていないのに。' },
  { t: 'わたしは、過敏性腸症候群(IBS)という病気を持っている。緊張すると、お腹が痛くなったり、ガスがたまったり、急にトイレに行きたくなったりする。' },
  { ch: [{ k: 'shadow', x: 70, s: 1.3 }], fx: 'whisper', s: 15, w: 'それ', t: '……また、鳴るよ。' },
  { w: 'それ', t: '静かな教室で。みんなが、聞いてる前で。' },
  { t: '「それ」は、わたしの不安が形になったもの。いつからか、影みたいに、ずっとついてくる。', c: [
      { t: 'ゆっくり息を吐いて、校門をくぐる', go: 'a_ok', s: -10 },
      { t: 'このまま、帰ってしまいたい……', go: 'a_ng' } ] },
  { L: 'a_ng', s: 10, t: '足が、地面に縫いつけられたみたいに動かない。' },
  { t: 'でも、ここで逃げたら、明日はもっと来られなくなる。わたしは、小さく息を吸った。', go: 'a_m0' },
  { L: 'a_ok', t: 'ゆっくり吸って、ゆっくり吐く。……大丈夫。まだ、大丈夫。' },

  { L: 'a_m0', chap: '第二章　静かな教室', bg: 'classroom', sc: { crowd: true }, ch: [{ k: 'shadow', x: 60, s: 1.3 }], ss: 40, t: '五限目、国語。先生が教科書を読む声だけが、教室に響いている。' },
  { t: 'しん、と静まりかえった教室。シャーペンの音まで、大きく聞こえる。' },
  { fx: 'rumble', s: 20, t: '……ぐ、ぐるる。' },
  { w: '{A}', t: '(だめ。だめ。いまは、だめ。)', c: [
      { t: 'お腹を押さえて、息をひそめる', go: 'a_hold' },
      { t: '手を挙げて、先生に言おうとする', go: 'a_hand' } ] },
  { L: 'a_hold', t: '息を止めて、ぎゅっと力を入れる。でも、力を入れるほど、お腹は言うことを聞かなくなる。', go: 'a_m1' },
  { L: 'a_hand', t: '手を挙げかけて、止まった。クラス全員の視線を想像したら、腕が上がらなかった。' },
  { L: 'a_m1', fx: 'rumble shake', s: 25, sc: { eyes: true }, t: 'ぎゅるるるる……。教室に、音が響いた。' },
  { fx: 'whisper giggle', t: '「……いまの、聞こえた？」「えっ、なに？」　くすくす。' },
  { ch: [{ k: 'shadow', x: 160, s: 2.4 }], s: 20, w: 'それ', t: 'ほら。やっぱり。' },
  { fx: 'chime', sc: { eyes: false }, ch: [], t: 'チャイムが鳴った瞬間、わたしは席を立った。' },

  { chap: '第三章　廊下', bg: 'corridor', sc: { loop: true }, ch: [], t: '廊下が、やけに長い。' },
  { ch: [{ k: 'shadow', x: 252, s: 1.6 }], fx: 'whisper', w: 'それ', t: '笑われる。笑われる。笑われる。' },
  { t: '足が、重い。', c: [
      { t: '走る', go: 'a_run' },
      { t: 'うつむいて、早歩きする', go: 'a_walk' } ] },
  { L: 'a_run', t: '走った。でも、トイレは、なかなか近づかない。', go: 'a_m2' },
  { L: 'a_walk', t: 'うつむいて、床だけを見て歩いた。誰とも、目を合わせないように。' },
  { L: 'a_m2', bg: 'toilet', sc: { occupied: false }, ch: [], ss: 60, t: '個室の鍵を閉めて、やっと、息ができた。' },
  { t: '涙が出た。' },
  { w: '{A}', t: 'わたしは、何も悪いことなんて、してないのに。' },
  { ch: [{ k: 'shadow', x: 262, s: 1.6 }], w: 'それ', t: 'ほらね。あなたは、ここに隠れるしかない。' },
  { ch: [], t: '「それ」の声に、うなずきかけて——ふと、思った。' },
  { w: '{A}', t: '(このままじゃ、だめだ。……誰かに、ちゃんと話さなきゃ)' },

  { chap: '第四章　お母さんへ', bg: 'home', ch: [{ k: 'mom', x: 215, f: 'blank' }], ss: 45, t: '夜。台所で、お母さんに話しかけた。' },
  { w: '{A}', t: 'お母さん、あのね。学校でお腹が痛くなって……みんなの前で、鳴っちゃって……。' },
  { w: 'お母さん', t: 'また？気にしすぎよ。みんな、緊張したらお腹くらい鳴るでしょう。' },
  { t: 'これまでにも、何度か話した。そのたびに、同じ答えが返ってきた。' },
  { ch: [{ k: 'mom', x: 215, f: 'blank' }, { k: 'shadow', x: 70, s: 1.5 }], fx: 'whisper', s: 10, w: 'それ', t: 'ね？ わかってもらえない。' },
  { t: '……どうする？', c: [
      { t: 'もう一度、ちゃんと話す', go: 'a_talk' },
      { t: '言うのを、やめる', go: 'a_hide' } ] },
  { L: 'a_hide', fx: 'shake', s: 25, ch: [{ k: 'mom', x: 215, f: 'blank' }, { k: 'shadow', x: 120, s: 2.3 }], t: 'わたしは、口を閉じた。「それ」が、大きくなる。' },
  { s: -5, t: '頭の中が、「それ」の声でいっぱいになる。……ひとりで抱えるのは、もう、限界だった。', go: 'a_talk' },
  { L: 'a_talk', ch: [{ k: 'mom', x: 215, f: 'blank' }, { k: 'shadow', x: 70, s: 1.5 }], t: '震える声で、もう一度、口を開いた。' },
  { w: '{A}', t: 'お願い、聞いて。気にしすぎなんかじゃないの。本当に、本当に、つらいの……！' },
  { t: '涙が、ぽろぽろ落ちた。こんなふうに泣きながら話したのは、はじめてだった。' },
  { fx: 'soft', ch: [{ k: 'mom', x: 215, f: 'sad' }, { k: 'shadow', x: 70, s: 1.5 }], s: -20, t: 'お母さんの顔が、変わった。はじめて、わたしの目を、まっすぐ見てくれた。' },
  { w: 'お母さん', t: '……ごめんね。ごめんね。気づいてあげられなくて。つらかったね。' },
  { ch: [{ k: 'mom', x: 215, f: 'sad' }, { k: 'shadow', x: 70, s: 1.1 }], s: -10, w: 'お母さん', t: '明日、一緒に先生に話しに行こう。病院にも、いっしょに行こうね。' },

  { chap: '第五章　先生に', bg: 'office', ch: [{ k: 'teacher', x: 205, f: 'normal' }], ss: 30, t: '次の日。お母さんと一緒に、相談室に行った。' },
  { w: '先生', t: '話してくれて、ありがとう。ゆっくりでいいよ。' },
  { t: 'わたしは、ずっと言えなかったことを、ひとつずつ話した。', c: [
      { t: '全部、話す', go: 'a_all' },
      { t: '話せるところだけ、話す', go: 'a_part' } ] },
  { L: 'a_all', w: '先生', t: 'そんなに長い間、ひとりで頑張ってきたんだね。', go: 'a_m3' },
  { L: 'a_part', w: '先生', t: '話せるところだけで、大丈夫。それだけでも、ちゃんと伝わってるよ。' },
  { L: 'a_m3', w: '先生', t: 'まず、席はドアの近くにしよう。出入りしやすいようにね。' },
  { w: '先生', t: '授業中は、このカードを見せれば、理由を言わなくてもトイレに出ていいことにしよう。他の先生には、必要なところだけ伝えておくよ。' },
  { w: '先生', t: 'しんどい日は、保健室で休んでいい。テストも、別の部屋で受けられるように、相談してみるね。' },
  { w: '先生', t: 'それと、お医者さんにも相談してみて。楽になる方法が見つかることも、あるからね。' },
  { ch: [{ k: 'teacher', x: 205, f: 'normal' }, { k: 'shadow', x: 60, s: .8 }], fx: 'soft', s: -25, t: '……「それ」が、ほんの少しだけ、小さくなった気がした。' },

  { chap: '第六章　もう一度、あの教室で', bg: 'classroom', sc: { crowd: true }, ch: [{ k: 'shadow', x: 60, s: .8 }], ss: 35, t: '数週間後。わたしの席は、ドアのすぐそばになった。' },
  { t: '国語の時間。先生の声と、ページをめくる音だけが、教室に響いている。' },
  { fx: 'rumble', s: 15, t: '……ぐる。また、鳴った。' },
  { w: '{A}', t: '(でも、カードがある。出てもいい。出てもいいんだ)' },
  { t: 'わたしは、カードをそっと机の上に置いた。先生が、小さくうなずく。' },
  { t: '静かに席を立って、ドアを閉める。誰も、笑わなかった。' },
  { fx: 'soft', s: -20, t: '廊下に出ると、息が、ふっと軽くなった。症状が消えたわけじゃない。でも、「逃げ道」がある。それだけで、ぜんぜん違った。' },

  { chap: '第七章　お昼休み', bg: 'lunch', ch: [{ k: 'B', x: 215, f: 'smile' }], ss: 15, t: 'お昼休み。{B}と、いつものお弁当。' },
  { w: '{B}', t: '最近、顔色いいね。' },
  { w: '{A}', t: '……あのね。{B}に、聞いてほしいことがあって。' },
  { t: 'わたしは、病気のこと、これまでのことを話した。声は、少し震えていた。' },
  { ch: [{ k: 'B', x: 215, f: 'sad' }], w: '{B}', t: '話してくれて、ありがとう。……私にできること、ある？' },
  { w: '{A}', t: 'ううん。聞いてくれた、それだけで、うれしい。' },

  { chap: '終章　それ', bg: 'classroom', sc: {}, tint: 'dark', ch: [{ k: 'A', x: 120, s: .95, f: 'sad' }], ss: 10, t: '放課後の教室。誰もいない。' },
  { t: 'ふり返ると、そこに「それ」がいた。——小さな、泣きそうな顔の、むかしのわたしだった。' },
  { w: 'それ', t: '……まだ、ここにいていい？' },
  { ch: [{ k: 'A', x: 120, s: .95, f: 'sad' }, { k: 'A', x: 215, s: 1.4, f: 'smile' }], fx: 'soft', s: -10, w: '{A}', t: 'うん。ごめんね、ずっと、ひとりにして。' },
  { w: 'それ', t: '……もう、ひとりじゃない？' },
  { w: '{A}', t: 'うん。もう、ひとりじゃないよ。' },
  { end: 'a_saved' },
];

/* ---------- 🟡 シナリオ ver.1 (主人公=B / Aは仲良しの友達) ---------- */
const V1_ROUTE = [
  { chap: '第一部　当たり前の日常', bg: 'lunch', ch: [{ k: 'A', x: 215, f: 'smile' }], ss: 5, t: '昼休み。いつもの場所で、いつものように、{A}とお弁当を広げる。' },
  { w: '{A}', t: '見て見て、今日の卵焼き、うまく焼けたんだ。食べる？' },
  { w: 'わたし', t: 'えっ、ほんと？ちょうだい！' },
  { t: 'クラスは別だけど、昼休みはいつも一緒。それが、わたしたちの当たり前だった。' },
  { ch: [{ k: 'A', x: 215, f: 'normal' }], t: 'ふと見ると、{A}がお腹のあたりを、そっと押さえていた。' },
  { t: 'そういえば、{A}は時々、体調を気にしている。でも、わたしはそれ以上のことは知らない。', c: [
      { t: '「大丈夫？」と聞く', go: 'v1_ask', e: 1 },
      { t: '気づかないふりをして、話を続ける', go: 'v1_skip' } ] },
  { L: 'v1_ask', w: '{A}', t: 'うん、大丈夫。ありがとう。' },
  { t: '{A}は笑った。ほんの少しだけ、さみしそうに見えた。', go: 'v1_m1' },
  { L: 'v1_skip', t: '{A}は少し笑って、話を合わせてくれた。' },
  { L: 'v1_m1', ch: [{ k: 'A', x: 215, f: 'smile' }], t: 'ドラマの話、テストの話、先生のものまね。くだらなくて、あたたかい時間。' },
  { fx: 'chime', t: '予鈴が鳴った。「またあとでね」と手を振って、わたしたちは別々の教室に戻った。' },

  { chap: '第二部　わたしに起こる変化', bg: 'classroom', sc: { crowd: true }, ch: [], ss: 20, t: '五限目、国語。先生が教科書を読む声だけが、教室に響いている。' },
  { s: 25, t: '……あれ？ お腹が、痛い。' },
  { t: 'オナラも出そうだ。でも、いまは国語の時間。静まり返った教室で、もし、いま、出てしまったら……。' },
  { fx: 'rumble', s: 20, t: 'ぐぅぅぅ……。外には出なかった。でも、お腹の中で、大きな音が鳴ってしまった。' },
  { sc: { eyes: true }, fx: 'whisper', t: 'まわりのクラスメイトが、ちらちらとこちらを見ている。' },
  { w: 'わたし', t: '(やばい、いまの、オナラだと思われたかな。ちがうのに……)', c: [
      { t: '何もなかったふりをする', go: 'v1_m2' },
      { t: 'うつむいて、時計ばかり見る', go: 'v1_m2' } ] },
  { L: 'v1_m2', sc: { eyes: false }, fx: 'chime', t: '五限目が終わった。トイレに行くため、席を立つ。' },
  { t: '教室を出ようとした、そのとき。' },
  { fx: 'giggle', w: 'クラスメイト', t: 'さっきさ、あの子、オナラしてたよね？笑' },
  { fx: 'sting', s: 25, t: 'ちがうのに。そうじゃないのに……！' },
  { bg: 'toilet', ch: [], t: '逃げるように、トイレに駆け込んだ。個室の中で、泣きそうになった。' },
  { ss: 65, t: 'それがトラウマになって、授業が怖くなった。静かで、まわりにたくさん人がいると、「いまお腹が痛くなったら」と考えてしまう。' },
  { t: '考えれば考えるほど、症状は悪化して、そんなことが頻繁に起きるようになった。' },
  { t: '数週間が経った。' },

  { chap: '第三部　初めての理解者', bg: 'lunch', ch: [{ k: 'A', x: 215, f: 'normal' }], ss: 55, cp: true, t: 'わたしは、思い切って、{A}に相談してみることにした。……どうする？', c: [
      { t: '{A}に相談する', go: 'v1_tell', e: 1 },
      { t: '誰にも言わず、ひとりで耐える', go: 'v1_hide' } ] },
  { L: 'v1_hide', bg: 'classroom', sc: { crowd: true }, ch: [], tint: 'dark', t: '言えない。きっと、わかってもらえない。「気にしすぎ」って言われたら、立ち直れない気がした。' },
  { t: '保健室に行く回数が増えた。休む日も、増えた。' },
  { t: '{A}が声をかけてくれた日もあった。でも、うまく笑えなかった。' },
  { t: 'いつの間にか、一緒にお弁当を食べることも、なくなっていた。' },
  { end: 'v1_bad' },
  { L: 'v1_tell', t: 'わたしは、{A}に話した。' },
  { w: 'わたし', t: '最近さ、授業とか、静かで人がいっぱいのとこで、緊張してお腹が痛くなっちゃって……全然、集中できないんだよね。' },
  { t: '目を下に落とした。きっと、わかってもらえない。「気にしすぎ」って、あしらわれるかもしれない。' },
  { t: '——でも、返ってきたのは、思っていたのとは、全く逆の言葉だった。' },
  { ch: [{ k: 'A', x: 215, f: 'sad' }], fx: 'soft', w: '{A}', t: '……私も。' },
  { t: '顔を上げると、{A}は、痛いほどわかる、という顔をしていた。' },
  { w: '{A}', t: '小さいころから、ずっとなの。過敏性腸症候群(IBS)っていってね。緊張したりすると、お腹が痛くなったり、ガスがたまったりするの。' },
  { t: '先生に相談して、どんな対策をとっているのかも、くわしく教えてくれた。' },

  { chap: '第四部　{A}の、もうひとつの物語', bg: 'home', tint: 'sepia', ch: [{ k: 'mom', x: 215, f: 'blank' }], ss: 30, t: '{A}は、ゆっくり話してくれた。むかしのことを。' },
  { w: '{A}', t: 'お母さんに何度話しても、なかなか、わかってもらえなかった。' },
  { ch: [{ k: 'mom', x: 215, f: 'sad' }], w: '{A}', t: 'でもある日、泣きながら「本当に苦しいんだ」って伝えたら、やっと、わかってもらえたの。' },
  { bg: 'office', tint: 'sepia', ch: [{ k: 'teacher', x: 205, f: 'normal' }], w: '{A}', t: 'それから先生に相談して、席を変えてもらったり、授業中に出ていいカードをもらったりした。' },
  { bg: 'lunch', tint: null, ch: [{ k: 'A', x: 215, f: 'sad' }], t: '{A}も、むかしは、誰かに支えてほしかった女の子だったんだ。' },
  { w: '{A}', t: '……こんな話、してもいい？ 引かない？', c: [
      { t: '最後まで、ただ、聞く', go: 'v1_listen', e: 2 },
      { t: '「でもさ、気にしすぎじゃない？」と言ってしまう', go: 'v1_wrong' } ] },
  { L: 'v1_wrong', fx: 'sting', ch: [{ k: 'A', x: 215, f: 'blank' }], t: '{A}の顔から、すっと表情が消えた。' },
  { w: '{A}', t: '……そっか。そう見えるよね。' },
  { t: 'わたしは、さっき自分が、いちばん言われたくなかった言葉を、口にしていた。' },
  { w: 'わたし', e: 1, t: 'ごめん。いまの、なし。……もう一回、聞かせて。', go: 'v1_m3' },
  { L: 'v1_listen', t: 'わたしは、うなずきながら、最後まで聞いた。' },
  { L: 'v1_m3', ch: [{ k: 'A', x: 215, f: 'smile' }], w: '{A}', t: '……話してくれて、ありがとう。私、ずっと一人だと思ってた。' },
  { w: 'わたし', t: '私のほうこそ。……話してよかった。' },

  { chap: '第五部　支え合うということ', bg: 'lunch', ch: [{ k: 'A', x: 215, f: 'normal' }], ss: 25, t: '二人で、できることを考えた。相談できる先生。席の位置。席を立つときの合図。病院のこと。' },
  { t: '放課後、先生のところへ行く話になった。', c: [
      { t: 'いっしょに、先生のところへ行く', go: 'v1_with', e: 2 },
      { t: '「{A}が頼んでみてね」と、見送る', go: 'v1_alone' } ] },
  { L: 'v1_with', t: '二人で、職員室の前に立った。{A}の手は、少し震えていた。わたしは、その横に並んだだけ。それだけで、{A}は小さく笑った。', go: 'v1_m4' },
  { L: 'v1_alone', t: '{A}は、ひとりで職員室に向かった。その背中が、少しだけ、小さく見えた。' },
  { L: 'v1_m4', fx: 'soft', bg: 'classroom', sc: { crowd: true }, ch: [], tint: null, ss: 25, t: '数週間後。症状が、すぐに消えたわけじゃない。でも、ひとりで抱え込まなくていいと知っただけで、授業は、少しだけ、怖くなくなった。' },
  { ch: [{ k: 'C', x: 60, f: 'sad' }], t: 'ある日の授業中。窓ぎわの席で、青白い顔でうつむいているクラスメイトに気づいた。' },
  { t: '……その表情に、見覚えがあった。むかしの、わたしだ。', c: [
      { t: 'そっと、声をかける', go: 'v1_speak' },
      { t: '気づいたけど、見なかったことにする', go: 'v1_pass' } ] },
  { L: 'v1_pass', end: 'v1_happy' },
  { L: 'v1_speak', jif: [g => g.emp >= 4, 'v1_true_go'], ch: [{ k: 'C', x: 60, f: 'normal' }], w: 'わたし', t: '大丈夫？ 無理に話さなくていいよ。話したくなったら、聞くからね。' },
  { end: 'v1_happy' },
  { L: 'v1_true_go', ch: [{ k: 'C', x: 60, f: 'normal' }], fx: 'soft', w: 'わたし', t: '大丈夫？ 無理に話さなくていいよ。話したくなったら、聞くからね。' },
  { t: 'あの日、{A}が「私も。」と言ってくれたように。今度は、わたしが、誰かのそばにいる番だった。' },
  { end: 'v1_true' },
];

/* ---------- 🟠 シナリオ ver.2 (主人公=B / Aはあまり親しくないクラスメイト) ---------- */
const V2_ROUTE = [
  { chap: '第一部　あの子、また？', bg: 'classroom', sc: { crowd: true }, ch: [{ k: 'A', x: 236, f: 'blank' }], ss: 10, t: '試験中。{A}が、また席を立った。今月、何度目だろう。' },
  { w: 'クラスメイト', t: 'またトイレ？' },
  { w: 'クラスメイト', t: '授業とかテスト、ちゃんと受けなくて大丈夫なのかな。' },
  { t: 'わたしは、{A}の事情を、何も知らない。だからこそ、何気ない疑問や、小さな誤解が生まれる。', c: [
      { t: '「ちょっと、ずるいな」と思う', go: 'v2_judge' },
      { t: '「何か事情があるのかも」と思う', go: 'v2_think', e: 1 },
      { t: '友達と、{A}の話をして笑う', go: 'v2_gossip', set: { gossip: true } } ] },
  { L: 'v2_judge', t: 'そう思ったことは、口には出さなかった。でも、心の中に、小さなトゲが残った。', go: 'v2_m1' },
  { L: 'v2_think', t: 'でも、すぐに思い直した。わたしには、何も分からないんだ、と。', go: 'v2_m1' },
  { L: 'v2_gossip', fx: 'giggle', w: '友達', t: 'ね、また行ったよ。' },
  { t: 'わたしも、笑っていた。' },
  { L: 'v2_m1', fx: 'chime', t: 'そのまま、その日は終わった。' },

  { chap: '第二部　わたしにも、起こる', bg: 'classroom', sc: { crowd: true }, ch: [], ss: 25, t: 'ある日、授業中に、お腹に違和感があった。' },
  { t: '最初は、すぐ治ると思っていた。' },
  { fx: 'rumble', s: 25, t: '……ぐる。' },
  { t: 'でも、静かな教室で、また鳴ったらどうしよう。そう考えはじめたら、授業が頭に入らなくなった。' },
  { fx: 'whisper', s: 20, t: '考えれば考えるほど、お腹は、落ち着かなくなる。' },
  { t: '誰にも見えない、この不安。わたしは、はじめて、外からは見えない苦しさを知った。' },

  { chap: '第三部　知らなかった事情', bg: 'classroom', sc: { crowd: true }, ch: [{ k: 'A', x: 236, f: 'normal' }], ss: 40, t: 'ふと、{A}のことを思い出した。' },
  { w: 'わたし', t: '(もしかして、{A}も、ずっとこういう不安を抱えていたのかな……)' },
  { t: 'でも、わたしの経験と、{A}の経験が、同じだとは限らない。', cp: true, c: [
      { t: '{A}に、直接、聞いてみる', go: 'v2_ask', e: 1 },
      { t: '「きっと私と同じだよね」と、決めつけて声をかける', go: 'v2_assume' } ] },
  { L: 'v2_assume', w: 'わたし', t: 'ねえ、{A}。お腹、弱いんでしょ？ わたしもなったから、わかるよ。気にしすぎだよ、きっとすぐ治るって。' },
  { ch: [{ k: 'A', x: 236, f: 'blank' }], fx: 'sting', w: '{A}', t: '……わかる、って、何が？' },
  { w: '{A}', t: 'ありがとう。でも、大丈夫。' },
  { t: 'それきり、{A}は、わたしと目を合わせなくなった。' },
  { t: '知ったつもりになったことで、わたしは、{A}の話を聞く入り口を、自分で閉ざしてしまった。' },
  { end: 'v2_bad_assume' },

  { L: 'v2_ask', w: 'わたし', t: 'あの……もし、嫌じゃなかったら、聞いてもいい？ 授業中、席を立つことが多いなって、気になってて。責めたいわけじゃなくて、知りたいの。' },
  { jif: [g => g.flags.gossip, 'v2_gossip_known'], t: '{A}は、少し驚いた顔をして、それから、小さくうなずいた。', go: 'v2_talk' },
  { L: 'v2_gossip_known', ch: [{ k: 'A', x: 236, f: 'blank' }], fx: 'sting', w: '{A}', t: '……前に、陰で、言ってたよね。私のこと。' },
  { t: '心臓が、どくん、と鳴った。', c: [
      { t: '「ごめんなさい」と、正直に謝る', go: 'v2_sorry', e: 2 },
      { t: '「そんなことしてないよ」とごまかす', go: 'v2_lie' } ] },
  { L: 'v2_lie', end: 'v2_bad_lie' },
  { L: 'v2_sorry', ch: [{ k: 'A', x: 236, f: 'normal' }], w: 'わたし', t: '……本当に、ごめん。事情も知らないのに、笑ってた。' },
  { t: '{A}は、しばらく黙って、それから、ふっと息を吐いた。' },
  { w: '{A}', t: '……うん。聞いてくれるなら、話すよ。' },

  { L: 'v2_talk', chap: '第四部　理解の始まり', bg: 'lunch', ch: [{ k: 'A', x: 215, f: 'normal' }], ss: 20, t: '放課後、わたしは、はじめて、{A}とちゃんと話した。' },
  { w: '{A}', t: '過敏性腸症候群(IBS)っていう病気なの。緊張すると、お腹が痛くなったり、急にトイレに行きたくなったりする。' },
  { w: '{A}', t: 'お母さんに何度話しても、なかなか伝わらなくてね。泣きながら話して、やっと、わかってもらえたの。' },
  { w: '{A}', t: 'それから先生にも相談して、席のことや、授業中に出ていく方法を、一緒に考えてもらったんだ。' },
  { t: '……話し終えたあと、{A}は、少し不安そうに、わたしを見た。', c: [
      { t: '「大変だったね。話してくれて、ありがとう」', go: 'v2_listen', e: 2 },
      { t: '「でも、授業中に何度も出るのは……」と言ってしまう', go: 'v2_wrong' } ] },
  { L: 'v2_wrong', ch: [{ k: 'A', x: 215, f: 'blank' }], fx: 'sting', w: '{A}', t: '……そうだよね。そう見えるよね。' },
  { t: 'わたしは、また、自分の物差しで決めつけようとしていた。' },
  { w: 'わたし', e: 1, t: 'ごめん。いまの、なし。……聞かせてくれて、ありがとう。', go: 'v2_m2' },
  { L: 'v2_listen', ch: [{ k: 'A', x: 215, f: 'smile' }], fx: 'soft', w: '{A}', t: '……ううん。聞いてくれて、ありがとう。' },
  { L: 'v2_m2', t: 'わたしは、これまで知らなかった{A}の一面に、気づいた。' },
  { t: '相手の事情を知らないまま判断することの、危うさ。それを、わたしは、考えはじめていた。' },

  { chap: '第五部　翌日の教室', bg: 'classroom', sc: { crowd: true }, ch: [], ss: 15, t: '次の日の教室。{A}が、そっと席を立った。' },
  { fx: 'giggle', w: 'クラスメイト', t: '{A}、また行ったね。ずるくない？' },
  { t: 'みんなが、わたしのほうを見た。同意を、待っている。', c: [
      { t: '一緒に笑う', go: 'v2_laugh' },
      { t: '聞こえなかったふりをする', go: 'v2_ignore' },
      { t: '「事情が、あるのかもしれないよ」と言う', go: 'v2_speak' } ] },
  { L: 'v2_laugh', end: 'v2_bad_laugh' },
  { L: 'v2_ignore', end: 'v2_happy' },
  { L: 'v2_speak', jif: [g => g.emp >= 3, 'v2_true_go'], w: 'わたし', t: '事情が、あるのかもしれないよ。' },
  { t: '教室の空気が、少しだけ、静かになった。' },
  { end: 'v2_happy' },
  { L: 'v2_true_go', fx: 'soft', w: 'わたし', t: '事情が、あるのかもしれないよ。本人に聞かないと、わからないし。' },
  { t: '教室の空気が、ほんの少し、変わった。' },
  { end: 'v2_true' },
];

const ROUTES = { bad: BAD_ROUTE, A: A_ROUTE, v1: V1_ROUTE, v2: V2_ROUTE };
/*__DATA_END__*/

/* =====================================================================
   ENGINE
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const fill = s => String(s).replace(/\{A\}/g, A_NAME).replace(/\{B\}/g, B_NAME);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 保存不可でも動作 */ } },
};

const W = 320, H = 180;
const cv = $('#scene'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* ---------- ゲーム状態 ---------- */
let G = { route: null, beats: [], labels: {}, i: 0, flags: {}, emp: 0, stress: 0, target: 0, cp: 0, snap: null, tok: 0, mode: 'idle', playing: false, waitClick: false, cur: null };
const SC = { bg: 'classroom', ch: [], f: {}, tint: 'dark', fade: 1 };
const OPT = { calm: store.get('calm', false), sound: store.get('sound', true) };
if (OPT.calm) document.body.classList.add('calm');

/* ---------- 描画ヘルパ ---------- */
function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function C(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function poly(pts, c) { ctx.fillStyle = c; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); }
function bands(y0, y1, c0, c1, step = 3) {
  const n = Math.ceil((y1 - y0) / step);
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1 || 1);
    R(0, y0 + i * step, W, step + 1, 'rgb(' + c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(',') + ')');
  }
}
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- 背景 ---------- */
const BG = {
  black() { R(0, 0, W, H, '#000'); },
  street(t) {
    bands(0, 125, [62, 70, 80], [150, 152, 150]);
    for (let i = 0; i < 4; i++) R(((30 + i * 80 + t * 2) % 360) - 20, 18 + (i % 2) * 14, 46, 8, 'rgba(210,210,210,.25)');
    R(30, 38, 260, 90, '#262a30');
    for (let j = 0; j < 3; j++) for (let i = 0; i < 9; i++) R(42 + i * 28, 48 + j * 26, 16, 14, (i * 5 + j * 3) % 7 === 0 ? '#b9aa72' : '#4a525c');
    R(140, 92, 40, 36, '#15171a');
    R(0, 125, W, 55, '#2b2b2d'); R(0, 125, W, 2, '#444');
    R(8, 60, 16, 100, '#1a1a1c'); R(296, 60, 16, 100, '#1a1a1c');
    R(268, 70, 6, 60, '#181410'); C(271, 60, 22, '#16221a');
  },
  lunch(t) {
    bands(0, 120, [130, 182, 222], [205, 228, 236]);
    for (let i = 0; i < 3; i++) { const x = ((60 + i * 100 + t * 3) % 380) - 30; C(x, 30 + i * 8, 14, 'rgba(255,255,255,.85)'); C(x + 16, 34 + i * 8, 10, 'rgba(255,255,255,.85)'); }
    R(0, 120, W, 60, '#8c7a62');
    for (let x = 0; x < W; x += 12) R(x, 86, 2, 36, '#5b6670');
    R(0, 86, W, 2, '#5b6670'); R(0, 104, W, 2, '#5b6670');
    R(70, 128, 180, 8, '#6b4a2f'); R(80, 136, 6, 18, '#3b2a1b'); R(234, 136, 6, 18, '#3b2a1b');
  },
  classroom(t, f) {
    R(0, 0, W, H, '#1c2125'); R(0, 118, W, 62, '#17130f');
    for (let i = 0; i < 8; i++) R(0, 118 + i * 8, W, 1, '#0f0c09');
    R(10, 20, 64, 56, '#0e1822'); R(12, 22, 28, 52, '#1a2e40'); R(42, 22, 30, 52, '#162838');
    R(41, 20, 2, 56, '#2b2b2b'); R(10, 47, 64, 2, '#2b2b2b');
    R(108, 18, 112, 50, '#0f2a22'); R(106, 16, 116, 2, '#4a3320'); R(106, 68, 116, 3, '#4a3320');
    R(116, 28, 50, 1, '#aab4ae'); R(116, 36, 74, 1, '#aab4ae'); R(116, 44, 40, 1, '#aab4ae');
    // 時計
    C(250, 30, 10, '#d8d4c8'); C(250, 30, 8.5, '#1a1a1a');
    const a = f.eyes ? 1.2 : t * 0.5; ctx.strokeStyle = '#d8d4c8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(250, 30); ctx.lineTo(250 + Math.sin(a) * 7, 30 - Math.cos(a) * 7); ctx.stroke();
    if (!f.nodoor) { R(284, 52, 30, 70, '#2a2118'); R(284, 52, 30, 2, '#4a3a28'); R(290, 58, 18, 16, '#0e1822'); }
    if (f.crowd) {
      const rows = [{ y: 96, s: .7, n: 6, gap: 40, x0: 28 }, { y: 114, s: .85, n: 5, gap: 52, x0: 30 }, { y: 136, s: 1, n: 4, gap: 68, x0: 36 }];
      rows.forEach(r => {
        for (let i = 0; i < r.n; i++) {
          const x = r.x0 + i * r.gap, y = r.y + Math.sin(t * 1.2 + x) * (f.eyes ? 1.2 : .3), s = r.s;
          R(x - 12 * s, y + 12 * s, 26 * s, 5 * s, '#3a2d20');
          R(x - 7 * s, y + 5 * s, 14 * s, 12 * s, '#0b0b0d');
          C(x, y, 6 * s, '#0b0b0d');
          if (f.eyes && Math.sin(t * 2.7 + x * 3) > -.92) { R(x - 3 * s, y - 1 * s, 2 * s, 2 * s, '#f2f2f2'); R(x + 1 * s, y - 1 * s, 2 * s, 2 * s, '#f2f2f2'); }
          if (f.grin) R(x - 3 * s, y + 2.5 * s, 6 * s, 1.6 * s, '#f2f2f2');
        }
      });
    }
    if (Math.random() < .025) R(0, 0, W, H, 'rgba(255,255,255,.06)');
  },
  corridor(t, f) {
    R(0, 0, W, H, '#0d0f10');
    poly([[0, 0], [W, 0], [200, 50], [120, 50]], '#14171a');
    poly([[0, H], [W, H], [200, 106], [120, 106]], '#1c1915');
    poly([[0, 0], [120, 50], [120, 106], [0, H]], '#20272b');
    poly([[W, 0], [200, 50], [200, 106], [W, H]], '#20272b');
    R(120, 50, 80, 56, '#15191b');
    const off = f.loop ? (t * 0.5) % 1 : 0, dz = z => z / (z + 1.5);
    for (let k = 0; k < 9; k++) {
      const z = k + (1 - off), d1 = dz(z), d2 = dz(z + 0.7);
      const x1 = lerp(0, 120, d1), x2 = lerp(0, 120, d2);
      const yb1 = lerp(H, 106, d1), yb2 = lerp(H, 106, d2), yt1 = lerp(0, 50, d1), yt2 = lerp(0, 50, d2);
      const tp1 = yt1 + (yb1 - yt1) * .22, tp2 = yt2 + (yb2 - yt2) * .22;
      const col = 'rgb(' + Math.round(48 - d1 * 24) + ',' + Math.round(42 - d1 * 22) + ',' + Math.round(36 - d1 * 20) + ')';
      poly([[x1, tp1], [x2, tp2], [x2, yb2], [x1, yb1]], col);
      poly([[W - x1, tp1], [W - x2, tp2], [W - x2, yb2], [W - x1, yb1]], col);
      const lw = lerp(24, 4, d1), ly = lerp(0, 50, d1) + 2;
      R(160 - lw / 2, ly, lw, Math.max(1, lw / 8), Math.sin(t * 9 + k * 5) > .85 ? '#333' : '#b8c0b0');
    }
    R(150, 64, 20, 42, '#2d2822');
    if (f.occupied) { R(156, 76, 8, 5, '#a31a22'); R(156, 80, 8, 1, '#500'); }
    if (Math.sin(t * 31) > .9) R(0, 0, W, H, 'rgba(0,0,0,.35)');
  },
  toilet(t, f) {
    R(0, 0, W, H, '#2a3236');
    for (let x = 0; x < W; x += 10) R(x, 0, 1, 130, '#1b2225');
    for (let y = 0; y < 130; y += 10) R(0, y, W, 1, '#1b2225');
    R(0, 130, W, 50, '#1c2124');
    for (let i = 0; i < 4; i++) { const x = 22 + i * 72; R(x, 50, 56, 86, '#33403f'); R(x, 50, 56, 3, '#222'); R(x + 2, 136, 52, 2, '#111'); R(x + 40, 92, 6, 3, i === 1 && f.occupied ? '#a31a22' : '#999'); }
    if (Math.sin(t * 23) > .88) R(0, 0, W, H, 'rgba(0,0,0,.4)');
  },
  home(t) {
    R(0, 0, W, H, '#3a2a22'); R(0, 125, W, 55, '#2a1d17');
    for (let x = 0; x < W; x += 24) R(x, 0, 1, 125, '#32231c');
    R(20, 30, 54, 50, '#0e1218'); R(46, 30, 2, 50, '#2b2b2b'); R(20, 54, 54, 2, '#2b2b2b');
    R(100, 112, 120, 8, '#6b4a2f'); R(108, 120, 6, 34, '#3b2a1b'); R(206, 120, 6, 34, '#3b2a1b');
    const g = ctx.createRadialGradient(160, 40, 4, 160, 70, 140); g.addColorStop(0, 'rgba(255,200,120,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    R(156, 28, 8, 6, '#f0d9a0'); R(159, 0, 2, 28, '#222');
  },
  office(t) {
    R(0, 0, W, H, '#2c3a38'); R(0, 125, W, 55, '#3a3128');
    R(230, 22, 66, 70, '#b8c7cf'); R(262, 22, 2, 70, '#6a7478'); R(230, 56, 66, 2, '#6a7478');
    R(40, 24, 50, 34, '#d8d4c8'); R(44, 28, 42, 26, '#7a9a8a');
    R(90, 104, 130, 8, '#5a4630'); R(94, 112, 122, 30, '#4a3826');
    C(60, 112, 14, '#2b4a30'); R(56, 118, 8, 20, '#4a3826');
    const g = ctx.createLinearGradient(230, 22, 140, 120); g.addColorStop(0, 'rgba(255,255,230,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
  void(t) {
    R(0, 0, W, H, '#050000');
    const g = ctx.createRadialGradient(160, 90, 10, 160, 90, 200); g.addColorStop(0, 'rgba(120,0,10,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const x = (i * 73) % 300 + 10, y = (i * 41) % 160 + 6; if (Math.sin(t * 2 + i * 1.7) > -.6) { R(x, y, 4, 1.5, '#e8e8e8'); R(x + 8, y, 4, 1.5, '#e8e8e8'); R(x + 1, y, 1.5, 1.5, '#900'); R(x + 9, y, 1.5, 1.5, '#900'); } }
  },
};

/* ---------- キャラクター ---------- */
const PAL = {
  A: { hair: '#17101a', skin: '#d2b29a', suit: '#26314c', legs: '#1b2236', collar: '#d8d8e0', long: true },
  B: { hair: '#4a3220', skin: '#d4b49c', suit: '#26314c', legs: '#1b2236', collar: '#d8d8e0' },
  C: { hair: '#222', skin: '#c9ab94', suit: '#2b2f38', legs: '#1b1d24', collar: '#d0d0d0' },
  mom: { hair: '#3a2a22', skin: '#d2b29a', suit: '#7a5a5a', legs: '#4a3a3a', apron: true, bun: true },
  teacher: { hair: '#2a2a2a', skin: '#d0b09a', suit: '#4a4e55', legs: '#2c2f35', glasses: true },
  mob: { hair: '#222', skin: '#c9ab94', suit: '#33363c', legs: '#1b1d24' },
};
function drawShadow(x, base, s, t) {
  const g = ctx.createRadialGradient(x, base - 40 * s, 4, x, base - 40 * s, 60 * s);
  g.addColorStop(0, 'rgba(60,0,10,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#040404'; ctx.beginPath();
  ctx.moveTo(x - 16 * s, base); ctx.lineTo(x - 10 * s, base - 52 * s); ctx.lineTo(x + 10 * s, base - 52 * s); ctx.lineTo(x + 16 * s, base); ctx.fill();
  C(x, base - 62 * s, 13 * s, '#040404');
  for (let i = 0; i < 6; i++) R(x - 17 * s + i * 6.6 * s, base - 3 * s, 4 * s, (4 + Math.sin(t * 3 + i) * 3 + 3) * s, '#040404');
  R(x - 7 * s, base - 64 * s, 5 * s, 2 * s, '#f2f2f2'); R(x + 2 * s, base - 64 * s, 5 * s, 2 * s, '#f2f2f2');
}
function drawPerson(c, t) {
  const st = G.stress || 0, base = c.y || 158, s = c.s || 1.4;
  const x = c.x + Math.sin(t * 1.3 + c.x) * (0.4 + st / 70);
  if (c.k === 'shadow') { drawShadow(x, base, s, t); return; }
  const P = PAL[c.k] || PAL.mob, hy = base - 58 * s, f = c.f || 'normal';
  R(x - 9 * s, base - 46 * s, 18 * s, 30 * s, P.suit);
  R(x - 12 * s, base - 44 * s, 4 * s, 22 * s, P.suit); R(x + 8 * s, base - 44 * s, 4 * s, 22 * s, P.suit);
  R(x - 9 * s, base - 16 * s, 18 * s, 16 * s, P.legs);
  if (P.collar) R(x - 5 * s, base - 46 * s, 10 * s, 4 * s, P.collar);
  if (P.apron) R(x - 8 * s, base - 36 * s, 16 * s, 20 * s, '#d8d0c0');
  C(x, hy, 10 * s, P.skin);
  ctx.fillStyle = P.hair; ctx.beginPath(); ctx.arc(x, hy, 10.8 * s, Math.PI, 0); ctx.fill();
  R(x - 10.5 * s, hy - 3 * s, 21 * s, 3 * s, P.hair);
  if (P.long) { R(x - 11.5 * s, hy - 4 * s, 4 * s, 26 * s, P.hair); R(x + 7.5 * s, hy - 4 * s, 4 * s, 26 * s, P.hair); }
  if (P.bun) C(x, hy - 12 * s, 5 * s, P.hair);
  if (f !== 'blank') {
    const ey = hy + 1 * s;
    if (f === 'eyes') { R(x - 6 * s, ey - 1 * s, 5 * s, 4 * s, '#f4f4f4'); R(x + 1 * s, ey - 1 * s, 5 * s, 4 * s, '#f4f4f4'); R(x - 4 * s, ey, 1.5 * s, 2 * s, '#111'); R(x + 3 * s, ey, 1.5 * s, 2 * s, '#111'); }
    else { R(x - 4.5 * s, ey, 2 * s, 2.2 * s, '#151515'); R(x + 2.5 * s, ey, 2 * s, 2.2 * s, '#151515'); }
    if (f === 'sad') { R(x - 4.5 * s, ey + 3 * s, 1.2 * s, 5 * s, '#7fb0e0'); R(x - 3 * s, ey + 7 * s, 6 * s, 1.2 * s, '#5a3a3a'); }
    else if (f === 'smile') R(x - 3 * s, ey + 5 * s, 6 * s, 1.4 * s, '#8a4a4a');
    else if (f === 'grin') R(x - 6 * s, ey + 4 * s, 12 * s, 2.2 * s, '#f2f2f2');
    else R(x - 2 * s, ey + 6 * s, 4 * s, 1.2 * s, '#6a4a4a');
    if (P.glasses) { ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.strokeRect(x - 6.5 * s, ey - .5 * s, 5 * s, 3.5 * s); ctx.strokeRect(x + 1.5 * s, ey - .5 * s, 5 * s, 3.5 * s); }
  }
}

/* ---------- メインループ ---------- */
let glitchUntil = 0;
const elVig = $('#vignette'), elBar = $('#stressbar i');
function frame(ts) {
  const t = ts / 1000;
  G.stress += (G.target - G.stress) * 0.03;
  ctx.save();
  const j = G.stress > 60 ? (G.stress - 60) / 40 : 0;
  if (j > 0 && !OPT.calm) ctx.translate(Math.round(rnd(-j, j)), Math.round(rnd(-j, j)));
  (BG[SC.bg] || BG.black)(t, SC.f);
  SC.ch.forEach(c => drawPerson(c, t));
  ctx.restore();
  const tints = { red: 'rgba(130,0,0,' + (0.22 + Math.sin(t * 3) * 0.06) + ')', sepia: 'rgba(130,85,30,.28)', cold: 'rgba(0,40,70,.22)', dark: 'rgba(0,0,0,.5)' };
  if (SC.tint && tints[SC.tint]) R(0, 0, W, H, tints[SC.tint]);
  if (!OPT.calm && performance.now() < glitchUntil) {
    for (let i = 0; i < 6; i++) { const y = Math.floor(rnd(0, H - 12)), h = Math.floor(rnd(4, 14)), dx = Math.floor(rnd(-18, 18)); ctx.drawImage(cv, 0, y, W, h, dx, y, W, h); }
  }
  for (let i = 0; i < 50; i++) R(rnd(0, W), rnd(0, H), 1, 1, 'rgba(255,255,255,' + rnd(.02, .12).toFixed(2) + ')');
  if (SC.fade > 0) { R(0, 0, W, H, 'rgba(0,0,0,' + SC.fade + ')'); SC.fade = Math.max(0, SC.fade - 0.03); }
  elVig.style.opacity = (0.35 + G.stress / 130).toFixed(2);
  elBar.style.width = Math.round(G.stress) + '%';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* =====================================================================
   AUDIO (WebAudioで生成。外部ファイル不要)
   ===================================================================== */
const AU = { ctx: null, out: null, noise: null, lps: [] };
function auInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    AU.ctx = c; AU.out = c.createGain(); AU.out.gain.value = OPT.sound ? 0.75 : 0; AU.out.connect(c.destination);
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    AU.noise = buf;
    [55, 82.5, 110.6].forEach((f, i) => {
      const o = c.createOscillator(); o.type = i ? 'sine' : 'sawtooth'; o.frequency.value = f;
      const g = c.createGain(); g.gain.value = i ? 0.022 : 0.011;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; AU.lps.push(lp);
      o.connect(lp); lp.connect(g); g.connect(AU.out); o.start();
    });
  } catch (e) { AU.ctx = null; }
}
function tone(f, d, type = 'sine', g = .1, f2 = 0, delay = 0) {
  if (!AU.ctx) return; const c = AU.ctx, o = c.createOscillator(), v = c.createGain(), t0 = c.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  v.gain.setValueAtTime(g, t0); v.gain.exponentialRampToValueAtTime(.0001, t0 + d);
  o.connect(v); v.connect(AU.out); o.start(t0); o.stop(t0 + d + .03);
}
function noise(d, type, f, q, g, lfoHz = 0, delay = 0) {
  if (!AU.ctx) return; const c = AU.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), v = c.createGain(), t0 = c.currentTime + delay;
  s.buffer = AU.noise; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  v.gain.setValueAtTime(.0001, t0); v.gain.exponentialRampToValueAtTime(g, t0 + Math.min(.08, d / 3)); v.gain.exponentialRampToValueAtTime(.0001, t0 + d);
  if (lfoHz) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lfoHz; lg.gain.value = g * .6; l.connect(lg); lg.connect(v.gain); l.start(t0); l.stop(t0 + d + .05); }
  s.connect(fl); fl.connect(v); v.connect(AU.out); s.start(t0); s.stop(t0 + d + .05);
}
const SFX = {
  click() { tone(880, .05, 'triangle', .05); },
  thump(k = .6) { tone(70, .18, 'sine', .7 * k, 38); tone(60, .16, 'sine', .45 * k, 34, .2); },
  rumble() { noise(1.5, 'lowpass', 140, 1, .8, 9); tone(48, 1.4, 'sine', .25, 36); },
  whisper() { for (let i = 0; i < 7; i++) noise(rnd(.12, .3), 'bandpass', rnd(2500, 4200), 2.5, .1, 0, i * rnd(.1, .2)); },
  giggle() { for (let i = 0; i < 8; i++) noise(.07, 'bandpass', rnd(1500, 2400), 6, .12, 0, i * rnd(.08, .17)); },
  sting() { tone(311, .9, 'sawtooth', .16); tone(330, .9, 'sawtooth', .16); tone(622, .6, 'square', .05); noise(.4, 'highpass', 3000, 1, .2); },
  chime() { [784, 659, 523, 392].forEach((f, i) => tone(f * 0.995, .7, 'sine', .14, 0, i * .55)); },
  knock() { for (let i = 0; i < 3; i++) { noise(.12, 'lowpass', 420, 1, .9, 0, i * .22); tone(95, .12, 'sine', .5, 60, i * .22); } },
  soft() { [262, 330, 392, 523].forEach((f, i) => tone(f, 3, 'sine', .05, 0, i * .12)); },
  flash() { noise(.25, 'highpass', 1500, 1, .35); },
};
function fxPlay(name) {
  if (SFX[name]) SFX[name]();
  const stage = $('#stage');
  if (name === 'shake' && !OPT.calm) { stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); setTimeout(() => stage.classList.remove('shake'), 520); }
  if (name === 'glitch') { glitchUntil = performance.now() + 700; if (!OPT.calm) { stage.classList.remove('glitch'); void stage.offsetWidth; stage.classList.add('glitch'); setTimeout(() => stage.classList.remove('glitch'), 520); } SFX.flash(); }
  if (name === 'sting' && !OPT.calm) { const f = $('#flash'); f.classList.add('red', 'on'); setTimeout(() => f.classList.remove('on'), 60); setTimeout(() => f.classList.remove('red'), 520); }
  if (name === 'flash' && !OPT.calm) { const f = $('#flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 60); }
  if (name === 'rumble' && !OPT.calm) { fxPlay('shake'); }
}
(function heartbeat() {
  const s = G.stress;
  if (AU.ctx && OPT.sound && G.playing && s > 25) SFX.thump(Math.min(1, s / 100));
  if (AU.ctx) AU.lps.forEach(lp => { lp.frequency.value = 180 + G.stress * 4; });
  setTimeout(heartbeat, Math.max(380, 1150 - s * 7));
})();
function setSound(on) {
  OPT.sound = on; store.set('sound', on);
  if (AU.out) AU.out.gain.value = on ? 0.75 : 0;
  $('#mute').textContent = on ? '♪ ON' : '♪ OFF';
}

/* =====================================================================
   テキスト送り
   ===================================================================== */
const TW = { timer: null, typing: false, full: '', done: null, speed: 38 };
function typeText(str, done) {
  const el = $('#text'); el.textContent = ''; clearInterval(TW.timer);
  TW.full = str; TW.done = done; TW.typing = true;
  let i = 0;
  TW.timer = setInterval(() => { i++; el.textContent = str.slice(0, i); if (i >= str.length) finishType(); }, TW.speed);
}
function finishType() {
  clearInterval(TW.timer); if (!TW.typing) return;
  TW.typing = false; $('#text').textContent = TW.full; if (TW.done) TW.done();
}
function advance() {
  if (G.mode !== 'text') return;
  if (TW.typing) { finishType(); return; }
  if (G.waitClick) { G.waitClick = false; $('#next').hidden = true; SFX.click(); next(0); }
}
$('#textbox').addEventListener('click', advance);
$('#stage').addEventListener('click', advance);
document.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { if (G.mode === 'text' && !$('#screen').classList.contains('on')) { e.preventDefault(); advance(); } }
  if (/^[1-4]$/.test(e.key)) { const b = $('#choices').children[+e.key - 1]; if (b) b.click(); }
});

/* =====================================================================
   シナリオ進行
   ===================================================================== */
function buildLabels(beats) { const m = {}; beats.forEach((b, i) => { if (b.L) m[b.L] = i; }); return m; }
function startRoute(name) {
  auInit();
  const beats = ROUTES[name];
  G.tok++;
  G = Object.assign(G, { route: name, beats, labels: buildLabels(beats), i: 0, flags: {}, emp: 0, stress: 0, target: 0, cp: 0, snap: null, mode: 'text', playing: true, waitClick: false, cur: null });
  SC.ch = []; SC.f = {}; SC.tint = null; SC.fade = 1;
  closeScreen(); $('#textbox').hidden = false; $('#choices').innerHTML = '';
  step();
}
function jump(label) { G.i = G.labels[label]; step(); }
function next(delay) {
  const tok = G.tok, b = G.cur || G.beats[G.i];
  setTimeout(() => { if (tok !== G.tok) return; if (b.go) G.i = G.labels[b.go]; else G.i++; step(); }, delay || 0);
}
function applyVisual(b) {
  if (b.bg) { SC.bg = b.bg; SC.f = {}; SC.tint = null; SC.fade = 1; }
  if (b.sc) SC.f = Object.assign({}, SC.f, b.sc);
  if ('tint' in b) SC.tint = b.tint;
  if (b.ch) SC.ch = b.ch.map(c => Object.assign({}, c));
  if ('ss' in b) G.target = clamp(b.ss);
  if (b.s) G.target = clamp(G.target + b.s);
  if (b.e) G.emp += b.e;
  if (b.set) Object.assign(G.flags, b.set);
  if (b.fx) b.fx.split(' ').forEach(fxPlay);
}
function step() {
  const b = G.beats[G.i]; if (!b) return;
  G.cur = b; const tok = G.tok;
  if (b.jif && b.jif[0](G)) { jump(b.jif[1]); return; }
  if (b.cp) G.snap = { i: G.i, emp: G.emp, flags: Object.assign({}, G.flags), target: G.target, stress: G.stress };
  const go = () => {
    if (tok !== G.tok) return;
    applyVisual(b);
    if (b.end) { showEnding(b.end); return; }
    if (b.t || b.c) showText(b); else next(b.wait || 30);
  };
  if (b.chap) chapter(b.chap, go); else go();
}
function showText(b) {
  G.mode = 'text';
  $('#name').textContent = b.w ? fill(b.w) : '';
  $('#choices').innerHTML = ''; $('#next').hidden = true;
  typeText(fill(b.t || ''), () => {
    if (b.c) showChoices(b);
    else { G.waitClick = true; $('#next').hidden = false; }
  });
}
function showChoices(b) {
  const box = $('#choices'); box.innerHTML = '';
  b.c.forEach((c, n) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.innerHTML = '<b>' + (n + 1) + '</b>' + fill(c.t);
    btn.addEventListener('click', () => {
      SFX.click(); box.innerHTML = '';
      if (c.e) G.emp += c.e;
      if (c.s) G.target = clamp(G.target + c.s);
      if (c.set) Object.assign(G.flags, c.set);
      G.i = c.go ? G.labels[c.go] : G.i + 1; step();
    });
    box.appendChild(btn);
  });
}
function chapter(text, cb) {
  const el = $('#chapter'); el.hidden = false; el.textContent = fill(text);
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  $('#textbox').style.visibility = 'hidden';
  const tok = G.tok;
  setTimeout(() => { el.hidden = true; $('#textbox').style.visibility = ''; if (tok === G.tok) cb(); }, 2300);
}

/* =====================================================================
   画面(タイトル / 診断 / 結果 / エンディング / 結末一覧)
   ===================================================================== */
const scr = $('#screen');
function openScreen(html, cls) { scr.innerHTML = '<div class="panel ' + (cls || '') + '">' + html + '</div>'; scr.classList.add('on'); scr.scrollTop = 0; return scr.firstChild; }
function closeScreen() { scr.classList.remove('on'); scr.innerHTML = ''; }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
function resetToTitleScene() {
  G.tok++; G.mode = 'idle'; G.playing = false; G.target = 0; G.waitClick = false; clearInterval(TW.timer); TW.typing = false;
  $('#textbox').hidden = true; $('#choices').innerHTML = ''; $('#chapter').hidden = true;
  SC.bg = 'classroom'; SC.f = {}; SC.ch = []; SC.tint = 'dark'; SC.fade = 1;
}

function showTitle() {
  resetToTitleScene();
  const done = Object.keys(store.get('endings', {})).length;
  const p = openScreen(
    '<p class="sub">過敏性腸症候群を知るための心理ホラー</p>' +
    '<h1>鳴ってはいけない教室</h1>' +
    '<div class="warn">※ 腹痛・おなら等の描写、からかい・孤立の描写、驚かせる演出があります。<br>' +
    '※ 音が出ます(ヘッドホン推奨)。<br>※ 気分が悪くなったら、いつでも中断してください。</div>' +
    '<button id="bStart" type="button">はじめる</button>' +
    '<button id="bGallery" type="button" class="small">結末一覧 (' + done + ' / ' + ENDING_ORDER.length + ')</button>' +
    '<label><input type="checkbox" id="oCalm"' + (OPT.calm ? ' checked' : '') + '> 演出を弱める(フラッシュ・揺れ・グリッチ)</label>' +
    '<details><summary>制作者用：ルートを直接選ぶ</summary>' +
    ['bad', 'A', 'v1', 'v2'].map(k => '<button type="button" class="small" data-route="' + k + '">' + ROUTE_INFO[k].sub + ' ' + ROUTE_INFO[k].name + '</button>').join('') +
    '</details>', 'title');
  $('#bStart', p).onclick = () => { auInit(); SFX.click(); showQuiz(); };
  $('#bGallery', p).onclick = () => { auInit(); SFX.click(); showGallery(); };
  $('#oCalm', p).onchange = e => { OPT.calm = e.target.checked; store.set('calm', OPT.calm); document.body.classList.toggle('calm', OPT.calm); };
  p.querySelectorAll('[data-route]').forEach(b => b.onclick = () => startRoute(b.dataset.route));
}

function showQuiz() {
  const ans = []; let n = 0;
  const render = () => {
    const q = QUIZ[n];
    const p = openScreen(
      '<div class="quiz-n">事前診断　' + (n + 1) + ' / ' + QUIZ.length + '</div>' +
      '<div class="quiz-bar">' + QUIZ.map((_, i) => '<i class="' + (i <= n ? 'on' : '') + '"></i>').join('') + '</div>' +
      '<div class="quiz-q">' + esc(q.t) + '</div>' +
      '<button type="button" data-a="y">はい</button><button type="button" data-a="n">いいえ</button>' +
      '<p class="tiny">※ これは医学的な診断ではありません。物語を選ぶための質問です。</p>');
    p.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      SFX.click(); ans.push(q[b.dataset.a]); n++;
      if (n < QUIZ.length) render(); else showResult(ans);
    });
  };
  render();
}

function showResult(ans) {
  const g = ans.filter(c => c === 'g').length, r = ans.length - g, route = routeFrom(g, r), info = ROUTE_INFO[route];
  fxPlay('whisper');
  const p = openScreen(
    '<div class="quiz-n">診断結果</div>' +
    '<div class="result-count">🟢 ' + g + '　　🔴 ' + r + '</div>' +
    '<h2>' + esc(info.name) + '</h2>' +
    '<div class="result-text">' + esc(RESULT_TEXT[route]) + '</div>' +
    '<button type="button" id="bGo">物語をはじめる</button>' +
    '<details><summary>別の物語を選ぶ</summary>' +
    ['A', 'v1', 'v2', 'bad'].filter(k => k !== route).map(k => '<button type="button" class="small" data-route="' + k + '">' + ROUTE_INFO[k].name + '</button>').join('') +
    '</details>');
  $('#bGo', p).onclick = () => startRoute(route);
  p.querySelectorAll('[data-route]').forEach(b => b.onclick = () => startRoute(b.dataset.route));
}

function showEnding(id) {
  G.mode = 'ending'; G.playing = false; G.target = 20;
  const e = ENDINGS[id], got = store.get('endings', {}); got[id] = true; store.set('endings', got);
  const kindName = { bad: 'BAD END', good: 'HAPPY END', true: 'TRUE END' }[e.kind];
  $('#textbox').hidden = true; $('#choices').innerHTML = '';
  if (e.kind === 'bad') { SC.tint = 'dark'; } else { fxPlay('soft'); }
  const p = openScreen(
    '<div class="ending-kind">' + kindName + '</div><h1>' + esc(fill(e.name)) + '</h1>' +
    e.lines.map((l, i) => '<p class="line" style="animation-delay:' + (0.8 + i * 1.3) + 's">' + esc(fill(l)) + '</p>').join('') +
    '<div class="note">' + esc(fill(e.note)) + '</div>' +
    (e.retry && G.snap ? '<button type="button" id="bRetry">選択をやり直す</button>' : '') +
    '<button type="button" id="bTitle">タイトルへ</button>' +
    '<button type="button" id="bGal" class="small">結末一覧 (' + Object.keys(got).length + ' / ' + ENDING_ORDER.length + ')</button>',
    'ending ' + e.kind);
  const r = $('#bRetry', p);
  if (r) r.onclick = () => {
    const s = G.snap; G.tok++; G.i = s.i; G.emp = s.emp; G.flags = Object.assign({}, s.flags); G.target = s.target; G.stress = s.stress;
    G.mode = 'text'; G.playing = true; closeScreen(); $('#textbox').hidden = false; step();
  };
  $('#bTitle', p).onclick = showTitle;
  $('#bGal', p).onclick = showGallery;
}

function showGallery() {
  const got = store.get('endings', {});
  const kindLabel = { bad: ['BAD', 'k-bad'], good: ['HAPPY', 'k-good'], true: ['TRUE', 'k-true'] };
  const p = openScreen(
    '<h2>結末一覧</h2><ul class="gallery">' +
    ENDING_ORDER.map(id => {
      const e = ENDINGS[id], k = kindLabel[e.kind];
      return got[id] ? '<li><div>' + esc(fill(e.name)) + '</div><span class="' + k[1] + '">' + k[0] + '</span></li>' : '<li class="lock"><div>？？？？？</div><span>—</span></li>';
    }).join('') + '</ul><button type="button" id="bBack">戻る</button>' +
    '<button type="button" id="bReset" class="small">記録を消す</button>');
  $('#bBack', p).onclick = showTitle;
  $('#bReset', p).onclick = () => { if (confirm('結末の記録を消しますか？')) { store.set('endings', {}); showGallery(); } };
}

/* ---------- ツールボタン ---------- */
$('#mute').addEventListener('click', () => { auInit(); setSound(!OPT.sound); });
$('#menu').addEventListener('click', () => { if (G.playing || G.mode === 'ending') { if (!confirm('タイトルに戻りますか？(進行は保存されません)')) return; } showTitle(); });
setSound(OPT.sound);
showTitle();
