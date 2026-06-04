(() => {
    const TOKEN_KEY = 'jwt_token';
    const FLASH_KEY = 'flash_message';
    const FLASH_TYPE_KEY = 'flash_type';

    const state = { token: null };

    function getToken() {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch {
            return null;
        }
    }

    function setToken(token) {
        state.token = token;
        localStorage.setItem(TOKEN_KEY, token);
    }

    function clearToken() {
        state.token = null;
        localStorage.removeItem(TOKEN_KEY);
    }

    function isAuthenticated() {
        const token = state.token || getToken();
        if (!token) {
            state.token = null;
            return false;
        }

        const decoded = decodeJwt(token);
        const nowInSeconds = Math.floor(Date.now() / 1000);

        if (!decoded?.exp || decoded.exp <= nowInSeconds) {
            clearToken();
            return false;
        }

        state.token = token;
        return true;
    }

    function authHeaders(headers = {}) {
        const currentToken = state.token || getToken();
        const finalHeaders = new Headers(headers);

        if (currentToken) {
            finalHeaders.set('Authorization', `Bearer ${currentToken}`);
        }

        return finalHeaders;
    }

    async function extractResponseMessage(response) {
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const data = await response.json();
            return data.message || data.error || JSON.stringify(data);
        }

        return response.text();
    }

    async function apiFetch(url, options = {}) {
        const finalOptions = { ...options };
        finalOptions.headers = authHeaders(finalOptions.headers || {});

        if (finalOptions.body && !(finalOptions.body instanceof FormData) && !finalOptions.headers.has('Content-Type')) {
            finalOptions.headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(url, finalOptions);

        if (response.status === 401) {
            setFlash('Sessão expirada. Faça login novamente.', 'danger');
            logout(false);
            window.location.href = '/';
            return response;
        }

        return response;
    }

    function setFlash(message, type = 'success') {
        sessionStorage.setItem(FLASH_KEY, message);
        sessionStorage.setItem(FLASH_TYPE_KEY, type);
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function renderAlert(message, type = 'success') {
        const container = document.querySelector('[data-alerts]');
        if (!container || !message) {
            return;
        }

        const alert = document.createElement('div');
        alert.className = `flash flash--${type}`;
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            <div class="flash__content">${escapeHtml(message)}</div>
            <button type="button" class="flash__close" data-alert-close aria-label="Fechar">×</button>
        `;

        container.appendChild(alert);

        window.setTimeout(() => {
            alert.classList.add('is-fading');
            window.setTimeout(() => alert.remove(), 220);
        }, 6000);
    }

    function openConfirm(message = 'Tem certeza?') {
        return new Promise((resolve) => {
            const modal = document.querySelector('[data-confirm-modal]');
            if (!modal) {
                // fallback to native confirm when modal not present
                resolve(window.confirm(message));
                return;
            }

            const msgEl = modal.querySelector('[data-confirm-message]');
            const btnConfirm = modal.querySelector('[data-confirm-confirm]');
            const btnCancel = modal.querySelector('[data-confirm-cancel]');

            msgEl.textContent = message;
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');

            const cleanup = (result) => {
                btnConfirm.removeEventListener('click', onConfirm);
                btnCancel.removeEventListener('click', onCancel);
                modal.classList.remove('is-open');
                modal.setAttribute('aria-hidden', 'true');
                // small delay to allow visual close
                window.setTimeout(() => resolve(result), 80);
            };

            function onConfirm() { cleanup(true); }
            function onCancel() { cleanup(false); }

            btnConfirm.addEventListener('click', onConfirm);
            btnCancel.addEventListener('click', onCancel);

            // click outside dialog closes
            modal.addEventListener('click', function onOverlay(e) {
                if (e.target === modal) {
                    modal.removeEventListener('click', onOverlay);
                    cleanup(false);
                }
            });

            // escape key
            function onKey(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', onKey);
                    cleanup(false);
                }
            }

            document.addEventListener('keydown', onKey);
        });
    }

    function showStoredFlash() {
        const message = sessionStorage.getItem(FLASH_KEY);
        const type = sessionStorage.getItem(FLASH_TYPE_KEY) || 'success';

        if (message) {
            renderAlert(message, type);
            sessionStorage.removeItem(FLASH_KEY);
            sessionStorage.removeItem(FLASH_TYPE_KEY);
        }
    }

    function updateNavbar() {
        const logged = isAuthenticated();

        document.querySelectorAll('[data-auth="guest"]').forEach((element) => {
            element.classList.toggle('d-none', logged);
        });

        document.querySelectorAll('[data-auth="user"]').forEach((element) => {
            element.classList.toggle('d-none', !logged);
        });

        const badge = document.querySelector('[data-user-badge]');
        if (badge) {
            badge.textContent = logged ? 'Usuário logado' : 'Visitante';
        }
    }

    function closeMobileMenu() {
        const menu = document.querySelector('[data-nav-menu]');
        const toggle = document.querySelector('[data-nav-toggle]');

        if (menu) {
            menu.classList.remove('is-open');
        }

        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
        }
    }

    function bindNavbarToggle() {
        const toggle = document.querySelector('[data-nav-toggle]');
        const menu = document.querySelector('[data-nav-menu]');

        if (!toggle || !menu) {
            return;
        }

        toggle.addEventListener('click', () => {
            const isOpen = menu.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        menu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                if (window.matchMedia('(max-width: 980px)').matches) {
                    closeMobileMenu();
                }
            });
        });
    }

    function requireAuth() {
        if (!isAuthenticated()) {
            setFlash('Faça login para acessar esta página.', 'warning');
            window.location.href = '/';
            return false;
        }

        return true;
    }

    function redirectIfAuthenticated() {
        if (isAuthenticated()) {
            window.location.href = '/dashboard';
        }
    }

    function logout(redirect = true) {
        clearToken();
        updateNavbar();

        if (redirect) {
            setFlash('Logout realizado com sucesso.', 'success');
            window.location.href = '/';
        }
    }

    function formToObject(form) {
        return Object.fromEntries(new FormData(form).entries());
    }

    function numberFromInput(value) {
        return Number(String(value).replace(',', '.'));
    }

    function decodeJwt(token) {
        if (!token || !token.includes('.')) {
            return null;
        }

        try {
            const payload = token.split('.')[1]
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const decoded = JSON.parse(atob(payload.padEnd(payload.length + ((4 - payload.length % 4) % 4), '=')));
            return decoded;
        } catch {
            return null;
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(Number(value || 0));
    }

    function renderProducts(rows, target) {
        if (!target) {
            return;
        }

        if (!rows.length) {
            target.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="empty-state text-center py-5">
                            <p class="fw-semibold mb-1">Nenhum produto cadastrado</p>
                            <p class="muted mb-0">Crie o primeiro produto para começar.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        target.innerHTML = rows.map((produto) => `
            <tr>
                <td class="fw-semibold">${escapeHtml(produto.nome ?? '')}</td>
                <td>${formatCurrency(produto.preco)}</td>
                <td class="product-description">${escapeHtml(produto.descricao ?? '')}</td>
                <td><span class="badge">${escapeHtml(produto.quantidade ?? 0)}</span></td>
                <td>
                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-secondary" type="button" data-edit-product>Editar</button>
                        <button class="btn btn-sm btn-danger" type="button" data-delete-product="${escapeHtml(produto.id ?? '')}">Excluir</button>
                    </div>
                </td>
            </tr>
        `).join('');

        target.querySelectorAll('[data-edit-product]').forEach((button, index) => {
            button.dataset.editProduct = JSON.stringify(rows[index]);
        });
    }

    async function loadProducts(targetSelector = '[data-products-list]') {
        const target = document.querySelector(targetSelector);
        if (!target) {
            return;
        }

        target.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">Carregando produtos...</td>
            </tr>
        `;

        try {
            const response = await apiFetch('/api/produtos');
            if (!response.ok) {
                throw new Error(await extractResponseMessage(response));
            }

            const produtos = await response.json();
            renderProducts(produtos, target);

            target.querySelectorAll('[data-delete-product]').forEach((button) => {
                button.addEventListener('click', handleDeleteProduct);
            });

            target.querySelectorAll('[data-edit-product]').forEach((button) => {
                button.addEventListener('click', handleEditProductShortcut);
            });
        } catch (error) {
            target.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger py-4">
                        ${escapeHtml(error.message || 'Erro ao carregar produtos')}
                    </td>
                </tr>
            `;
        }
    }

    function handleEditProductShortcut(event) {
        const raw = event.currentTarget.dataset.editProduct;
        if (!raw) {
            return;
        }

        try {
            const produto = JSON.parse(raw);

            const editForm = document.querySelector('[data-form="produto-edit"]');
            if (editForm) {
                editForm.querySelector('[name="nome"]').value = produto.nome ?? '';
                editForm.querySelector('[name="descricao"]').value = produto.descricao ?? '';
                editForm.querySelector('[name="preco"]').value = produto.preco ?? '';
                editForm.querySelector('[name="quantidade"]').value = produto.quantidade ?? '';
                editForm.dataset.produtoId = produto.id ?? '';
                editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            window.location.href = `/produtos/${produto.id ?? ''}/editar`;
        } catch {
            setFlash('Não foi possível abrir o produto para edição.', 'danger');
        }
    }

    async function handleDeleteProduct(event) {
        const id = event.currentTarget.getAttribute('data-delete-product');

        if (!id) {
            return;
        }

        const confirmed = await openConfirm('Deseja excluir este produto?');
        if (!confirmed) return;

        try {
            const response = await apiFetch(`/api/produtos/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(await extractResponseMessage(response));
            }

            setFlash('Produto excluído com sucesso.', 'success');
            await loadProducts();
        } catch (error) {
            renderAlert(error.message || 'Erro ao excluir produto', 'danger');
        }
    }

    async function handleLoginSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const submitButton = form.querySelector('[type="submit"]');
        const originalText = submitButton?.textContent;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Entrando...';
        }

        try {
            const payload = formToObject(form);
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(await extractResponseMessage(response));
            }

            const data = await response.json();
            setToken(data.token);
            updateNavbar();
            setFlash('Login realizado com sucesso.', 'success');
            window.location.href = '/dashboard';
        } catch (error) {
            renderAlert(error.message || 'Erro ao realizar login.', 'danger');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText || 'Entrar';
            }
        }
    }

    async function handleRegisterSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const submitButton = form.querySelector('[type="submit"]');
        const originalText = submitButton?.textContent;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Cadastrando...';
        }

        try {
            const payload = formToObject(form);
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(await extractResponseMessage(response));
            }

            setFlash('Usuário cadastrado com sucesso. Faça login para continuar.', 'success');
            window.location.href = '/';
        } catch (error) {
            renderAlert(error.message || 'Erro ao cadastrar usuário.', 'danger');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText || 'Cadastrar';
            }
        }
    }

    async function handleProdutoCreateSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const submitButton = form.querySelector('[type="submit"]');
        const originalText = submitButton?.textContent;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';
        }

        try {
            const payload = formToObject(form);
            payload.preco = numberFromInput(payload.preco);
            payload.quantidade = Number(payload.quantidade);

            const response = await apiFetch('/api/produtos', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(await extractResponseMessage(response));
            }

            setFlash('Produto criado com sucesso.', 'success');
            form.reset();
            window.location.href = '/produtos';
        } catch (error) {
            renderAlert(error.message || 'Erro ao criar produto.', 'danger');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText || 'Salvar produto';
            }
        }
    }

    async function handleProdutoEditSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const produtoId = form.dataset.produtoId;
        const submitButton = form.querySelector('[type="submit"]');
        const originalText = submitButton?.textContent;

        if (!produtoId) {
            renderAlert('Selecione um produto para editar.', 'warning');
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Atualizando...';
        }

        try {
            const payload = formToObject(form);
            payload.preco = numberFromInput(payload.preco);
            payload.quantidade = Number(payload.quantidade);

            const response = await apiFetch(`/api/produtos/${produtoId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(await extractResponseMessage(response));
            }

            setFlash('Produto atualizado com sucesso.', 'success');
            window.location.href = '/produtos';
        } catch (error) {
            renderAlert(error.message || 'Erro ao atualizar produto.', 'danger');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText || 'Atualizar produto';
            }
        }
    }

    async function loadProfile() {
        const nameField = document.querySelector('[data-profile-name]');
        const emailField = document.querySelector('[data-profile-email]');
        const idField = document.querySelector('[data-profile-id]');
        const initialsField = document.querySelector('[data-profile-initials]');
        const container = document.querySelector('[data-profile-loading]');
        const tokenPayload = decodeJwt(state.token || getToken()) || {};

        if (!nameField && !emailField && !idField && !initialsField) {
            return;
        }

        try {
            const response = await apiFetch('/perfil');

            if (!response.ok) {
                throw new Error(await extractResponseMessage(response));
            }

            const data = await response.json();
            const usuario = data.usuario || data;
            const profileId = usuario.id ?? tokenPayload.id ?? '-';
            const profileEmail = usuario.email ?? tokenPayload.email ?? '-';
            const profileName = usuario.nome ?? tokenPayload.nome ?? 'Usuário logado';

            if (nameField) {
                nameField.textContent = profileName;
            }

            if (emailField) {
                emailField.textContent = profileEmail;
            }

            if (idField) {
                idField.textContent = profileId;
            }

            if (initialsField) {
                const initials = (profileName || 'U')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0].toUpperCase())
                    .join('');
                initialsField.textContent = initials || 'U';
            }

            if (container) {
                container.classList.add('d-none');
            }
        } catch (error) {
            renderAlert(error.message || 'Não foi possível carregar o perfil.', 'danger');
        }
    }

    function bindGlobalEvents() {
        bindNavbarToggle();

        document.querySelectorAll('[data-logout]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                logout(true);
            });
        });

        document.addEventListener('click', (event) => {
            const closeButton = event.target.closest('[data-alert-close]');
            if (closeButton) {
                const alert = closeButton.closest('.flash');
                alert?.remove();
            }
        });
    }

    function init() {
        updateNavbar();
        showStoredFlash();
        bindGlobalEvents();

        const page = document.body?.dataset?.page || '';

        if (page === 'login') {
            redirectIfAuthenticated();
            document.querySelector('[data-form="login"]')?.addEventListener('submit', handleLoginSubmit);
            return;
        }

        if (page === 'register') {
            redirectIfAuthenticated();
            document.querySelector('[data-form="register"]')?.addEventListener('submit', handleRegisterSubmit);
            return;
        }

        if (!requireAuth()) {
            return;
        }

        if (page === 'dashboard') {
            loadProducts();
            loadProfile();
            document.querySelector('[data-form="produto-create"]')?.addEventListener('submit', handleProdutoCreateSubmit);
            document.querySelector('[data-form="produto-edit"]')?.addEventListener('submit', handleProdutoEditSubmit);
        }

        if (page === 'produtos-index') {
            loadProducts();
            document.querySelector('[data-form="produto-create"]')?.addEventListener('submit', handleProdutoCreateSubmit);
            document.querySelector('[data-form="produto-edit"]')?.addEventListener('submit', handleProdutoEditSubmit);
        }

        if (page === 'produto-create') {
            document.querySelector('[data-form="produto-create"]')?.addEventListener('submit', handleProdutoCreateSubmit);
        }

        if (page === 'produto-edit') {
            document.querySelector('[data-form="produto-edit"]')?.addEventListener('submit', handleProdutoEditSubmit);
        }

        if (page === 'perfil') {
            loadProfile();
        }
    }

    window.App = {
        apiFetch,
        setToken,
        getToken,
        clearToken,
        logout,
        setFlash,
        loadProducts,
        loadProfile,
        requireAuth,
        redirectIfAuthenticated
    };

    document.addEventListener('DOMContentLoaded', init);
})();