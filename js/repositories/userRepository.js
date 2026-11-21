import { User } from '../classes/user.js';

export class UserRepository {
  constructor() {
    this.storageKey = 'conpila_user';
    this.usersListKey = 'conpila_registered_users';
    this._initData();
  }

  _initData() {
    if (!localStorage.getItem(this.usersListKey)) {
      localStorage.setItem(this.usersListKey, JSON.stringify([]));
    }
  }

  getRegisteredUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.usersListKey)) || [];
    } catch {
      return [];
    }
  }

  saveRegisteredUsers(users) {
    localStorage.setItem(this.usersListKey, JSON.stringify(users));
  }

  getCurrentUser() {
    try {
      const rawData = JSON.parse(localStorage.getItem(this.storageKey));
      if (!rawData) return new User();

      const users = this.getRegisteredUsers();
      const registered = users.find(u => String(u.id) === String(rawData.id));
      const merged = registered ? { ...registered, ...rawData } : rawData;

      if (!merged.avatar || merged.avatar.trim() === '') {
        merged.avatar = 'images/user-solid.png';
      }
      return new User(merged);
    } catch {
      return new User();
    }
  }

  getUserById(userId) {
    if (!userId) return null;
    const users = this.getRegisteredUsers();
    const found = users.find(u => String(u.id) === String(userId));
    return found ? new User(found) : null;
  }

  updateUserFollowersCount(targetUserId, delta) {
    if (!targetUserId || !delta) return;
    const users = this.getRegisteredUsers();
    const idx = users.findIndex(u => String(u.id) === String(targetUserId));
    if (idx !== -1) {
      users[idx].followersCount = Math.max(0, (Number(users[idx].followersCount) || 0) + delta);
      this.saveRegisteredUsers(users);

      const currentRaw = JSON.parse(localStorage.getItem(this.storageKey));
      if (currentRaw && String(currentRaw.id) === String(targetUserId)) {
        currentRaw.followersCount = users[idx].followersCount;
        localStorage.setItem(this.storageKey, JSON.stringify(currentRaw));
      }
    }
  }

  updateUserFollowingCount(targetUserId, delta) {
    if (!targetUserId || !delta) return;
    const users = this.getRegisteredUsers();
    const idx = users.findIndex(u => String(u.id) === String(targetUserId));
    if (idx !== -1) {
      users[idx].followingCount = Math.max(0, (Number(users[idx].followingCount) || 0) + delta);
      this.saveRegisteredUsers(users);

      const currentRaw = JSON.parse(localStorage.getItem(this.storageKey));
      if (currentRaw && String(currentRaw.id) === String(targetUserId)) {
        currentRaw.followingCount = users[idx].followingCount;
        localStorage.setItem(this.storageKey, JSON.stringify(currentRaw));
      }
    }
  }

  setCurrentUser(userData) {
    const raw = userData instanceof User ? { ...userData } : userData;
    if (!raw.avatar || raw.avatar.trim() === '') {
      raw.avatar = 'images/user-solid.png';
    }
    localStorage.setItem(this.storageKey, JSON.stringify(raw));
    this.registerOrUpdateUser(raw);
    return new User(raw);
  }

  registerOrUpdateUser(userData) {
    const users = this.getRegisteredUsers();
    const idx = users.findIndex(u =>
      (userData.id && String(u.id) === String(userData.id)) ||
      (userData.email && u.email && u.email.toLowerCase() === userData.email.toLowerCase()) ||
      (userData.username && u.username && u.username.toLowerCase() === userData.username.toLowerCase())
    );

    let avatarPath = userData.avatar ? userData.avatar.trim() : '';
    if (!avatarPath) {
      avatarPath = (idx !== -1 && users[idx].avatar) ? users[idx].avatar : 'images/user-solid.png';
    }

    const userObj = {
      id: userData.id || (idx !== -1 ? users[idx].id : 'usr_' + Date.now()),
      email: userData.email || (idx !== -1 ? users[idx].email : ''),
      username: userData.username || (idx !== -1 ? users[idx].username : ''),
      password: userData.password || (idx !== -1 ? users[idx].password : ''),
      name: userData.name || (idx !== -1 ? users[idx].name : 'Usuario'),
      avatar: avatarPath,
      theme: userData.theme === 'light' || userData.theme === 'dark'
        ? userData.theme
        : (idx !== -1 && (users[idx].theme === 'light' || users[idx].theme === 'dark')
          ? users[idx].theme
          : (localStorage.getItem('theme') === 'light' || localStorage.getItem('conpila_theme') === 'light' ? 'light' : 'dark')),
      bio: userData.bio || (idx !== -1 ? users[idx].bio : 'Miembro de ConPila. ¡Hola a toda la comunidad tech!'),
      followersCount: userData.followersCount !== undefined ? userData.followersCount : (idx !== -1 ? users[idx].followersCount : 0),
      followingCount: userData.followingCount !== undefined ? userData.followingCount : (idx !== -1 ? users[idx].followingCount : 0)
    };

    if (idx !== -1) {
      users[idx] = { ...users[idx], ...userObj };
    } else {
      users.push(userObj);
    }
    this.saveRegisteredUsers(users);
    return userObj;
  }

  registerUser(userData) {
    const created = this.registerOrUpdateUser(userData);
    return this.setCurrentUser(created);
  }

  loginWithEmailOrUsername(identifier, password) {
    const cleanId = String(identifier || '').trim().toLowerCase();
    const cleanPass = String(password || '');
    if (!cleanId || !cleanPass) return null;

    const users = this.getRegisteredUsers();
    const found = users.find(u =>
      ((u.email && u.email.toLowerCase() === cleanId) ||
       (u.username && u.username.toLowerCase() === cleanId)) &&
      u.password === cleanPass
    );

    if (!found) {
      return null;
    }

    const savedTheme = found.theme === 'light' || found.theme === 'dark'
      ? found.theme
      : (localStorage.getItem('theme') === 'light' || localStorage.getItem('conpila_theme') === 'light' ? 'light' : 'dark');
    return this.setCurrentUser({ ...found, theme: savedTheme });
  }

  updateCurrentUser(userData) {
    const current = this.getCurrentUser();
    const updated = { ...current, ...userData };
    if (!updated.avatar || updated.avatar.trim() === '') {
      updated.avatar = 'images/user-solid.png';
    }
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
    this.registerOrUpdateUser(updated);
    return new User(updated);
  }

  updateFollowCounts(deltaFollowing = 0, deltaFollowers = 0) {
    const current = this.getCurrentUser();
    current.followingCount = Math.max(0, current.followingCount + deltaFollowing);
    current.followersCount = Math.max(0, current.followersCount + deltaFollowers);
    localStorage.setItem(this.storageKey, JSON.stringify(current));
    this.registerOrUpdateUser(current);
    return current;
  }
}