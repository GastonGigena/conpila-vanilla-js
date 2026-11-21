import { Contact } from '../classes/contact.js';
import { UserRepository } from './userRepository.js';

export class ContactRepository {
  constructor() {
    this.storageKey = 'conpila_contacts';
    this.followsKey = 'conpila_following_map';
    this._initData();
  }

  _initData() {
    // 1. Inicializar lista base vacía de contactos
    if (!localStorage.getItem(this.storageKey)) {
      const initialContacts = [];
      localStorage.setItem(this.storageKey, JSON.stringify(initialContacts));
    }

    // 2. Inicializar mapa de relaciones de seguimiento vacío
    if (!localStorage.getItem(this.followsKey)) {
      const initialFollows = {};
      localStorage.setItem(this.followsKey, JSON.stringify(initialFollows));
    }
  }

  getFollowingMap() {
    try {
      return JSON.parse(localStorage.getItem(this.followsKey)) || {};
    } catch {
      return {};
    }
  }

  saveFollowingMap(map) {
    localStorage.setItem(this.followsKey, JSON.stringify(map));
  }

  getFollowingList(userId) {
    if (!userId) return [];
    const map = this.getFollowingMap();
    return Array.isArray(map[String(userId)]) ? map[String(userId)] : [];
  }

  isFollowing(followerId, targetContactId) {
    if (!followerId || !targetContactId) return false;
    const list = this.getFollowingList(followerId);
    return list.includes(String(targetContactId));
  }

  getCommunityContacts() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    } catch {
      return [];
    }
  }

  /**
   * Obtiene la lista unificada de todos los usuarios y contactos disponibles para ser seguidos.
   * Excluye al usuario actual (para no seguirse a sí mismo).
   */
  getAll(currentUserId = null) {
    const userRepo = new UserRepository();
    const current = userRepo.getCurrentUser();
    const activeUserId = currentUserId || (current ? current.id : null);

    const registeredUsers = userRepo.getRegisteredUsers();
    const communityContacts = this.getCommunityContacts();

    const contactsMap = new Map();

    // 1. Agregar todos los usuarios registrados en ConPila
    registeredUsers.forEach(u => {
      // Excluir al usuario actualmente autenticado
      if (activeUserId && String(u.id) === String(activeUserId)) {
        return;
      }
      if (current && current.email && u.email && current.email.toLowerCase() === u.email.toLowerCase()) {
        return;
      }

      const contactId = String(u.id);
      const isFollow = activeUserId ? this.isFollowing(activeUserId, contactId) : false;

      contactsMap.set(contactId, new Contact({
        id: contactId,
        name: u.name || 'Usuario',
        username: u.username || '',
        avatar: u.avatar || 'images/user-solid.png',
        bio: u.bio || '',
        followersCount: u.followersCount || 0,
        followingCount: u.followingCount || 0,
        isFollowing: isFollow,
        isRegisteredUser: true
      }));
    });

    // 2. Agregar los contactos comunitarios que no colisionen con los usuarios registrados
    communityContacts.forEach(c => {
      // Si el contacto coincide por nombre con el usuario activo, omitirlo
      if (current && current.name && current.name.toLowerCase() === c.name.toLowerCase()) {
        return;
      }

      // Evitar duplicados por nombre o ID
      let exists = false;
      for (const [id, item] of contactsMap.entries()) {
        if (item.name.toLowerCase() === c.name.toLowerCase() || String(id) === String(c.id)) {
          exists = true;
          break;
        }
      }

      if (!exists) {
        const contactId = String(c.id);
        const isFollow = activeUserId ? this.isFollowing(activeUserId, contactId) : false;
        contactsMap.set(contactId, new Contact({
          id: contactId,
          name: c.name,
          avatar: c.avatar,
          isFollowing: isFollow,
          isRegisteredUser: false
        }));
      }
    });

    return Array.from(contactsMap.values());
  }

  search(term = '', currentUserId = null) {
    const contacts = this.getAll(currentUserId);
    const query = term.toLowerCase().trim();
    if (!query) return contacts;
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      (contact.username && contact.username.toLowerCase().includes(query)) ||
      (contact.bio && contact.bio.toLowerCase().includes(query))
    );
  }

  /**
   * Alterna el estado de seguimiento de un contacto o usuario por parte del usuario autenticado.
   * Actualiza las relaciones persistentes y los contadores en ambos perfiles.
   */
  toggleFollow(targetContactId, followerId = null) {
    const userRepo = new UserRepository();
    if (!followerId) {
      const current = userRepo.getCurrentUser();
      followerId = current ? current.id : null;
    }
    if (!followerId || !targetContactId) return false;

    const fId = String(followerId);
    const tId = String(targetContactId);

    // No permitir seguirse a uno mismo
    if (fId === tId) return false;

    const map = this.getFollowingMap();
    if (!Array.isArray(map[fId])) {
      map[fId] = [];
    }

    const isCurrentlyFollowing = map[fId].includes(tId);
    const willFollow = !isCurrentlyFollowing;

    if (willFollow) {
      map[fId].push(tId);
      userRepo.updateUserFollowingCount(fId, 1);
      userRepo.updateUserFollowersCount(tId, 1);
    } else {
      map[fId] = map[fId].filter(id => id !== tId);
      userRepo.updateUserFollowingCount(fId, -1);
      userRepo.updateUserFollowersCount(tId, -1);
    }

    this.saveFollowingMap(map);
    return willFollow;
  }
}