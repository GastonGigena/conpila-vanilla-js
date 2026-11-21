import { Post } from '../classes/post.js';

export class PostRepository {
  constructor() {
    this.storageKey = 'conpila_posts';
    this._initData();
  }

  _initData() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  getAll() {
    try {
      const rawData = JSON.parse(localStorage.getItem(this.storageKey)) || [];
      return rawData.map(item => new Post(item));
    } catch {
      return [];
    }
  }

  search(term = '') {
    const posts = this.getAll();
    const query = term.toLowerCase().trim();
    if (!query) return posts;
    return posts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.body.toLowerCase().includes(query) ||
      post.userName.toLowerCase().includes(query)
    );
  }

  create(newPostData) {
    const rawData = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    let avatar = newPostData.userAvatar;

    if (!avatar || avatar.trim() === '') {
      avatar = 'images/user-solid.png';
    }

    const isSolid = avatar === 'images/user-solid.png';
    const newPost = {
      id: String(Date.now()),
      userId: newPostData.userId || null,
      userName: newPostData.userName || 'Usuario',
      userAvatar: avatar,
      createdAt: new Date().toISOString(),
      date: 'Hace un momento',
      title: newPostData.title,
      body: newPostData.body,
      image: newPostData.image || '',
      reactions: {}, // Objeto para almacenar { userId: 'like' | 'dislike' }
      likes: 0,
      dislikes: 0,
      isUserSolid: isSolid,
      comments: []
    };

    rawData.unshift(newPost);
    localStorage.setItem(this.storageKey, JSON.stringify(rawData));
    return new Post(newPost);
  }

  update(updatedPost) {
    const rawData = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    const index = rawData.findIndex(p => String(p.id) === String(updatedPost.id));
    
    if (index !== -1) {
      const reactions = updatedPost.reactions || {};
      
      // Calcular totales directamente desde el mapa de reacciones
      const likesCount = Object.values(reactions).filter(r => r === 'like').length;
      const dislikesCount = Object.values(reactions).filter(r => r === 'dislike').length;

      rawData[index] = {
        ...rawData[index],
        reactions: reactions,
        likes: likesCount,
        dislikes: dislikesCount,
        comments: updatedPost.comments || rawData[index].comments || []
      };
      localStorage.setItem(this.storageKey, JSON.stringify(rawData));
    }
  }

  updateUserData(userIdentifier, updatedUserData) {
    const rawData = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    let updated = false;

    const newName = updatedUserData.name ? updatedUserData.name.trim() : null;
    const newAvatar = updatedUserData.avatar ? updatedUserData.avatar.trim() : null;

    const targetId = userIdentifier ? String(userIdentifier).trim() : '';
    const targetName = newName ? newName.toLowerCase() : (userIdentifier ? String(userIdentifier).trim().toLowerCase() : '');

    const updatedData = rawData.map(post => {
      let postChanged = false;

      const postUserId = post.userId ? String(post.userId).trim() : '';
      const postUserName = post.userName ? String(post.userName).trim().toLowerCase() : '';

      const isPostAuthor = (targetId && postUserId === targetId) || (targetName && postUserName === targetName);

      if (isPostAuthor) {
        if (newName) post.userName = newName;
        if (newAvatar) {
          post.userAvatar = newAvatar;
          post.isUserSolid = newAvatar === 'images/user-solid.png';
        }
        postChanged = true;
      }

      if (Array.isArray(post.comments)) {
        post.comments.forEach(comment => {
          const commentUserId = comment.userId ? String(comment.userId).trim() : '';
          const commentUserName = comment.userName ? String(comment.userName).trim().toLowerCase() : '';

          const isCommentAuthor = (targetId && commentUserId === targetId) || (targetName && commentUserName === targetName);

          if (isCommentAuthor) {
            if (newName) comment.userName = newName;
            if (newAvatar) comment.userAvatar = newAvatar;
            postChanged = true;
          }
        });
      }

      if (postChanged) updated = true;
      return post;
    });

    if (updated) {
      localStorage.setItem(this.storageKey, JSON.stringify(updatedData));
    }
  }

  updateUserAvatar(userIdentifier, newAvatar) {
    this.updateUserData(userIdentifier, { avatar: newAvatar });
  }
}