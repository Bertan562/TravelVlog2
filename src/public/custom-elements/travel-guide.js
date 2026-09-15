class TravelGuide extends HTMLElement {

    static get observedAttributes() {
        return ["data-guide"];
    }

    constructor() {
        super();

        this.guide = null;
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {

        if (name !== "data-guide") {
            return;
        }

        if (oldValue === newValue) {
            return;
        }

        this.render();
    }

    render() {

        const rawData = this.getAttribute("data-guide");

        if (!rawData) {
            return;
        }

        let guide;

        try {

            guide = JSON.parse(rawData);

        } catch (error) {

            console.error(
                "TravelGuide: data-guide JSON okunamadı.",
                error
            );

            return;
        }

        this.guide = guide;

        /*
         * ============================================
         * CMS ALANLARI
         * ============================================
         */

        const title =
            guide.title ||
            "";

        const description =
            guide.kisaAciklama ||
            guide.description ||
            "";

        const content =
            guide.content ||
            "";


        /*
         * ============================================
         * SAYFADA ZİYARETÇİYE GÖSTERİLECEK HTML
         * ============================================
         */

        this.innerHTML = `

            <article class="travel-guide">

                ${
                    title
                        ? `
                            <header class="travel-guide-header">

                                <h1 class="travel-guide-title">
                                    ${this.escapeHTML(title)}
                                </h1>

                            </header>
                        `
                        : ""
                }


                ${
                    description
                        ? `
                            <div class="travel-guide-description">
                                <p>
                                    ${this.escapeHTML(description)}
                                </p>
                            </div>
                        `
                        : ""
                }


                ${
                    content
                        ? `
                            <div class="travel-guide-content">
                                ${content}
                            </div>
                        `
                        : ""
                }

            </article>

        `;


        /*
         * ============================================
         * GOOGLE / SEO MARKUP
         * ============================================
         *
         * Wix Custom Element SEO sistemi,
         * bu HTML'i arama motorlarına sunabilir.
         *
         * ÖNEMLİ:
         * SEO markup ile ekranda görünen içerik
         * aynı olmalıdır.
         */

        this.seoMarkup = `

            <article class="travel-guide-seo">

                ${
                    title
                        ? `
                            <header>

                                <h1>
                                    ${this.escapeHTML(title)}
                                </h1>

                            </header>
                        `
                        : ""
                }


                ${
                    description
                        ? `
                            <p>
                                ${this.escapeHTML(description)}
                            </p>
                        `
                        : ""
                }


                ${
                    content
                        ? `
                            <div class="travel-guide-content">

                                ${content}

                            </div>
                        `
                        : ""
                }

            </article>

        `;
    }


    /*
     * ============================================
     * HTML GÜVENLİK
     * ============================================
     *
     * title ve description gibi düz metinleri
     * HTML'e güvenli şekilde ekler.
     */

    escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

}


/*
 * ============================================
 * CUSTOM ELEMENT
 * ============================================
 *
 * Wix'teki Custom Element Tag Name:
 *
 * travel-guide
 *
 */

if (!customElements.get("travel-guide")) {

    customElements.define(
        "travel-guide",
        TravelGuide
    );

}
