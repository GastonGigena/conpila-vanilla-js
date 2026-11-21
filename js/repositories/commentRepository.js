import { Comment } from '../classes/comment.js';

export class CommentRepository {
  constructor() {
    this.storageKey = 'conpila_comments';
    this._initData();
  }

  _initData() {
    if (!localStorage.getItem(this.storageKey)) {
      const initialComments = [
        {
          id: 'c1',
          postId: '1',
          userName: 'Elena Rostova',
          userAvatar: 'images/avatar 4.jpg',
          date: 'Hace 1 hora',
          text: 'Desde la perspectiva del flujo de datos, delegar la navegación a una etiqueta <a> invalida la semántica del formulario.'
        },
        {
          id: 'c2',
          postId: '1',
          userName: 'Alejandro Gómez',
          userAvatar: 'images/avatar 3.jpg',
          date: 'Hace 45 min',
          text: 'Lo ideal para resolver este fallo de lógica sería sustituir el hipervínculo por un <button type="submit">.'
        },
        {
          id: 'c3',
          postId: '1',
          userName: 'Gabriela Benítez',
          userAvatar: 'images/avatar 5.jpg',
          date: 'Hace 10 min',
          text: 'Esto representa un problema crítico de UX y accesibilidad.'
        },
        {
          id: 'c4',
          postId: '2',
          userName: 'Oh Llama',
          userAvatar: 'images/llama-3431.png',
          date: 'Hace 2 días',
          text: '“Cuando te pregunte qué hace una línea, respondé: ‘Es una abstracción de alto nivel’.”'
        },
        {
          id: 'c5',
          postId: '2',
          userName: 'Lucky Dog',
          userAvatar: 'images/dog.jpg',
          date: 'Hace 45 min',
          text: 'Yo lo encaro y le digo: "Profe, si reconoce el código es porque usted también lo sacó de internet."'
        }
      ];
      localStorage.setItem(this.storageKey, JSON.stringify(initialComments));
    }
  }

  getByPostId(postId) {
    try {
      const rawData = JSON.parse(localStorage.getItem(this.storageKey)) || [];
      return rawData
        .filter(item => String(item.postId) === String(postId))
        .map(item => new Comment(item));
    } catch {
      return [];
    }
  }

  create(newCommentData) {
    const rawData = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    let authorName = newCommentData.userName;
    let authorAvatar = newCommentData.userAvatar;

    if (!authorName || !authorAvatar) {
      try {
        const userRaw = JSON.parse(localStorage.getItem('conpila_user'));
        if (userRaw?.name && !authorName) authorName = userRaw.name;
        if (userRaw?.avatar && !authorAvatar) authorAvatar = userRaw.avatar;
      } catch {}
    }

    if (!authorAvatar || authorAvatar.trim() === '') {
      authorAvatar = 'images/user-solid.png';
    }

    const newComment = {
      id: 'c' + Date.now(),
      postId: String(newCommentData.postId),
      userName: authorName || 'Usuario',
      userAvatar: authorAvatar,
      createdAt: new Date().toISOString(),
      date: 'Hace un momento',
      text: newCommentData.text
    };

    rawData.push(newComment);
    localStorage.setItem(this.storageKey, JSON.stringify(rawData));
    return new Comment(newComment);
  }
}
