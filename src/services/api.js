// EcoLogix Kurumsal Lojistik ve Optimizasyon REST API Servisi

const BASE_URL = "http://localhost:8080/api";

export const ApiService = {
    // AUTH
    async login(username, password) {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Kullanıcı adı veya şifre hatalı.");
        }

        return await response.json();
    },

    async register(userData) {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Kayıt işlemi başarısız.");
        }

        return await response.json();
    },

    // 2. Kurye Yönetimi
    async getAllCouriers() {
        const response = await fetch(`${BASE_URL}/couriers`);
        return await response.json();
    },

    // 3. AI Optimizasyon Merkezi
    async compareAlgorithms(courierId) {
        const branchCity = localStorage.getItem("branchCity");

        const response = await fetch(
            `${BASE_URL}/optimization/compare/${courierId}?branchCity=${encodeURIComponent(branchCity || '')}`
        );

        if (!response.ok) throw new Error("Rapor alınamadı. Dağıtıma hazır veri olup olmadığını kontrol edin.");
        return await response.json();
    },

    // 4. Rota Atama
    async assignBestRoute(shipmentIds, courierId, algorithm, distance, carbonEmitted, carbonSaved) {
        const response = await fetch(
            `${BASE_URL}/shipments/assign-route?courierId=${courierId}&algorithm=${encodeURIComponent(algorithm)}&distance=${distance}&carbonEmitted=${carbonEmitted}&carbonSaved=${carbonSaved}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shipmentIds)
            }
        );

        if (!response.ok) throw new Error("Rota atama işlemi başarısız.");

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }

        return await response.text();
    },

    async getAnalytics() {
        const response = await fetch(`${BASE_URL}/optimization/analytics`);
        return await response.json();
    },

    async getActiveRoute(courierId) {
        const response = await fetch(`${BASE_URL}/shipments/courier/${courierId}/active-route`);
        return await response.json();
    },

    async getAllShipments() {
        const response = await fetch(`${BASE_URL}/shipments`);
        if (!response.ok) throw new Error("Sevkiyat listesi backend'den çekilemedi.");
        return await response.json();
    },

    async trackShipmentByCustomer(trackingNumber) {
        const response = await fetch(`${BASE_URL}/shipments/track/${trackingNumber}`);
        if (!response.ok) throw new Error("Kargo takip numarası geçersiz veya bulunamadı.");
        return await response.json();
    },

    async updateShipmentStatus(id, newStatus) {
        const response = await fetch(`${BASE_URL}/shipments/${id}/status?status=${newStatus}`, {
            method: 'PUT'
        });

        if (!response.ok) throw new Error("Durum güncellenirken hata oluştu.");

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }

        return await response.text();
    },

    async deliverShipment(id) {
        const response = await fetch(`${BASE_URL}/shipments/${id}/deliver`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error("Teslim/aktarma işlemi tamamlanamadı.");
        return await response.text();
    },

    async createShipment(shipment) {
        const response = await fetch(`${BASE_URL}/shipments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shipment)
        });

        if (!response.ok) throw new Error("Ürün kaydı oluşturulamadı.");
        return await response.json();
    },

    async createCourier(courier) {
        const response = await fetch(`${BASE_URL}/couriers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courier)
        });

        if (!response.ok) throw new Error("Kurye kaydı oluşturulamadı.");
        return await response.json();
    },

    async forwardShipment(id) {
        const response = await fetch(`${BASE_URL}/shipments/${id}/forward`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error("Aktarma işlemi tamamlanamadı.");
        return await response.text();
    },

    async readyForDelivery(id) {
        const response = await fetch(`${BASE_URL}/shipments/${id}/ready-for-delivery`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error("Ürün dağıtıma hazır hale getirilemedi.");
        return await response.text();
    },

    async getAllBranches() {
        const response = await fetch(`${BASE_URL}/branches`);
        if (!response.ok) throw new Error("Şubeler alınamadı.");
        return await response.json();
    },

    async createBranch(branchData) {
        const response = await fetch(`${BASE_URL}/branches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(branchData)
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Şube kaydı oluşturulamadı.");
        }

        return await response.json();
    },

    async getAllBranches() {
        const response = await fetch(`${BASE_URL}/branches`);

        if (!response.ok) {
            throw new Error("Şubeler alınamadı.");
        }

        return await response.json();
    },

};
