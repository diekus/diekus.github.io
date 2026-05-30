const ACTOR = 'diekus.bsky.social';
const API_URL = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${ACTOR}&limit=5&filter=posts_no_replies`;
const PROFILE_URL = `https://bsky.app/profile/${ACTOR}`;

function relativeTime(isoString) {
  const delta = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(delta / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

async function loadBlueskyCard() {
  const card = document.getElementById('bluesky-card');
  if (!card) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { feed } = await res.json();
    const entry = feed?.find(item => !item.reason);
    if (!entry) throw new Error('no original post');

    const { post } = entry;
    const { record } = post;
    const text = record.text ?? '';

    card.querySelector('.social-card__text').textContent =
      text.length > 280 ? `${text.slice(0, 280)}…` : text;

    const timeEl = card.querySelector('.social-card__date');
    timeEl.setAttribute('datetime', record.createdAt);
    timeEl.textContent = relativeTime(record.createdAt);

    const embedImages = post.embed?.images;
    if (embedImages?.length) {
      const imgEl = card.querySelector('.social-card__image');
      imgEl.src = embedImages[0].thumb;
      imgEl.alt = embedImages[0].alt ?? '';
      imgEl.hidden = false;
    }

    if (post.likeCount > 0) {
      const likeItem = card.querySelector('.social-card__like-item');
      likeItem.querySelector('.social-card__likes').textContent = post.likeCount;
      likeItem.hidden = false;
    }
    if (post.repostCount > 0) {
      const repostItem = card.querySelector('.social-card__repost-item');
      repostItem.querySelector('.social-card__reposts').textContent = post.repostCount;
      repostItem.hidden = false;
    }

    const rkey = post.uri.split('/').pop();
    card.href = `${PROFILE_URL}/post/${rkey}`;
    const snippet = text.slice(0, 80).replace(/\n/g, ' ');
    card.setAttribute('aria-label', `Bluesky post (${relativeTime(record.createdAt)}): ${snippet}`);

  } catch {
    clearTimeout(timeoutId);
    card.classList.add('social-card--fallback');
  }
}

const MASTODON_HOST = 'toot.cafe';
const MASTODON_ACCT = 'diekus';
const MASTODON_PROFILE_URL = `https://${MASTODON_HOST}/@${MASTODON_ACCT}`;

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent ?? '').trim();
}

async function loadMastodonCard() {
  const card = document.getElementById('mastodon-card');
  if (!card) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const acctRes = await fetch(
      `https://${MASTODON_HOST}/api/v1/accounts/lookup?acct=${MASTODON_ACCT}`,
      { signal: controller.signal }
    );
    if (!acctRes.ok) throw new Error(`HTTP ${acctRes.status}`);
    const { id } = await acctRes.json();

    const statusesRes = await fetch(
      `https://${MASTODON_HOST}/api/v1/accounts/${id}/statuses?limit=20&exclude_replies=true&exclude_reblogs=true`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!statusesRes.ok) throw new Error(`HTTP ${statusesRes.status}`);

    const statuses = await statusesRes.json();
    const status = statuses.find(s => !s.reblog && !s.pinned);
    if (!status) throw new Error('no status');

    const text = stripHtml(status.content);

    card.querySelector('.social-card__text').textContent =
      text.length > 280 ? `${text.slice(0, 280)}…` : text;

    const timeEl = card.querySelector('.social-card__date');
    timeEl.setAttribute('datetime', status.created_at);
    timeEl.textContent = relativeTime(status.created_at);

    const attachment = status.media_attachments?.[0];
    if (attachment?.type === 'image') {
      const imgEl = card.querySelector('.social-card__image');
      imgEl.src = attachment.preview_url;
      imgEl.alt = attachment.description ?? '';
      imgEl.hidden = false;
    }

    if (status.favourites_count > 0) {
      const likeItem = card.querySelector('.social-card__like-item');
      likeItem.querySelector('.social-card__likes').textContent = status.favourites_count;
      likeItem.hidden = false;
    }
    if (status.reblogs_count > 0) {
      const repostItem = card.querySelector('.social-card__repost-item');
      repostItem.querySelector('.social-card__reposts').textContent = status.reblogs_count;
      repostItem.hidden = false;
    }

    card.href = status.url;
    const snippet = text.slice(0, 80).replace(/\n/g, ' ');
    card.setAttribute('aria-label', `Mastodon post (${relativeTime(status.created_at)}): ${snippet}`);

  } catch {
    clearTimeout(timeoutId);
    card.classList.add('social-card--fallback');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadBlueskyCard();
  loadMastodonCard();
});
