use crate::models::ProductView;
use chrono::{DateTime, Utc};

const BRAND: &str = "Arateki";
const FEED_TITLE: &str = "Arateki Product Catalog";
const FEED_DESCRIPTION: &str = "Current Arateki products for shopping catalogs.";
const GOOGLE_PRODUCT_CATEGORY: &str = "Electronics > Electronics Accessories";
const PRODUCT_TYPE: &str = "Electronics > Components";

const LANGS: [&str; 5] = ["pt", "en", "es", "zh", "ja"];

struct Offer {
    id: String,
    title: String,
    description: String,
    availability: &'static str,
    condition: &'static str,
    price: String,
    link: String,
    image_link: String,
    brand: String,
    mpn: String,
}

pub fn build_google_shopping_xml(products: &[ProductView], site_url: &str, locale: &str) -> String {
    let offers = build_offers(products, site_url, locale);
    let items: String = offers
        .iter()
        .map(|o| {
            format!(
                r#"    <item>
      <title>{title}</title>
      <link>{link}</link>
      <description>{desc}</description>
      <g:id>{id}</g:id>
      <g:image_link>{img}</g:image_link>
      <g:availability>{av}</g:availability>
      <g:price>{price}</g:price>
      <g:condition>{cond}</g:condition>
      <g:brand>{brand}</g:brand>
      <g:mpn>{mpn}</g:mpn>
      <g:google_product_category>{gpc}</g:google_product_category>
      <g:product_type>{pt}</g:product_type>
    </item>"#,
                title = escape_xml(&o.title),
                link = escape_xml(&o.link),
                desc = escape_xml(&o.description),
                id = escape_xml(&o.id),
                img = escape_xml(&o.image_link),
                av = o.availability,
                price = escape_xml(&o.price),
                cond = o.condition,
                brand = escape_xml(&o.brand),
                mpn = escape_xml(&o.mpn),
                gpc = escape_xml(GOOGLE_PRODUCT_CATEGORY),
                pt = escape_xml(PRODUCT_TYPE),
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>{title}</title>
    <link>{link}</link>
    <description>{desc}</description>
{items}
  </channel>
</rss>
"#,
        title = escape_xml(FEED_TITLE),
        link = escape_xml(site_url),
        desc = escape_xml(FEED_DESCRIPTION),
        items = items
    )
}

pub fn build_products_tsv(products: &[ProductView], site_url: &str, locale: &str) -> String {
    let offers = build_offers(products, site_url, locale);
    let header = "id\ttitle\tdescription\tavailability\tcondition\tprice\tlink\timage_link\tbrand\tmpn\tgoogle_product_category\tproduct_type";
    let mut lines = vec![header.to_string()];
    for o in offers {
        lines.push(format!(
            "{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}",
            sanitize(&o.id),
            sanitize(&o.title),
            sanitize(&o.description),
            o.availability,
            o.condition,
            sanitize(&o.price),
            sanitize(&o.link),
            sanitize(&o.image_link),
            sanitize(&o.brand),
            sanitize(&o.mpn),
            sanitize(GOOGLE_PRODUCT_CATEGORY),
            sanitize(PRODUCT_TYPE),
        ));
    }
    lines.push(String::new());
    lines.join("\n")
}

pub fn build_meta_catalog_csv(products: &[ProductView], site_url: &str, locale: &str) -> String {
    let offers = build_offers(products, site_url, locale);
    let header = "id,title,description,availability,condition,price,link,image_link,brand,mpn,google_product_category,product_type";
    let mut lines = vec![header.to_string()];
    for o in offers {
        lines.push(format!(
            "{},{},{},{},{},{},{},{},{},{},{},{}",
            csv(&o.id),
            csv(&o.title),
            csv(&o.description),
            csv(o.availability),
            csv(o.condition),
            csv(&o.price),
            csv(&o.link),
            csv(&o.image_link),
            csv(&o.brand),
            csv(&o.mpn),
            csv(GOOGLE_PRODUCT_CATEGORY),
            csv(PRODUCT_TYPE),
        ));
    }
    lines.push(String::new());
    lines.join("\n")
}

pub fn build_sitemap_xml(products: &[ProductView], site_url: &str) -> String {
    let mut urls = Vec::new();
    let static_paths = [("/", "weekly", 1.0_f64), ("/sales", "daily", 0.9)];
    for (path, freq, prio) in static_paths {
        for lang in LANGS {
            urls.push(render_url(
                site_url,
                &localized_path(lang, path),
                path,
                freq,
                prio,
                None,
            ));
        }
    }
    for product in products {
        let product_path = format!("/sales/{}", urlencoding_encode(&product.id));
        for lang in LANGS {
            urls.push(render_url(
                site_url,
                &localized_path(lang, &product_path),
                &product_path,
                "weekly",
                0.8,
                Some(product.updated_at),
            ));
        }
    }
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
{}
</urlset>
"#,
        urls.join("\n")
    )
}

fn build_offers(products: &[ProductView], site_url: &str, locale: &str) -> Vec<Offer> {
    let mut out = Vec::new();
    for product in products {
        let variant = product
            .variants
            .iter()
            .find(|v| v.active && v.stock > 0)
            .or_else(|| product.variants.iter().find(|v| v.active));
        let Some(variant) = variant else { continue };
        let Some(image) = product.image_url.as_ref() else { continue };
        if product.price_cents <= 0 {
            continue;
        }
        out.push(Offer {
            id: product.id.clone(),
            title: product.name.clone(),
            description: product.description.clone(),
            availability: if product.stock > 0 {
                "in stock"
            } else {
                "out of stock"
            },
            condition: "new",
            price: format!(
                "{:.2} {}",
                product.price_cents as f64 / 100.0,
                product.currency
            ),
            link: format!(
                "{}/{}/sales/{}",
                site_url,
                locale,
                urlencoding_encode(&product.id)
            ),
            image_link: absolute_url(image, site_url),
            brand: BRAND.into(),
            mpn: variant.sku.clone(),
        });
    }
    out
}

fn render_url(
    site_url: &str,
    path: &str,
    base_path: &str,
    changefreq: &str,
    priority: f64,
    lastmod: Option<DateTime<Utc>>,
) -> String {
    let mut lines = vec![
        "  <url>".into(),
        format!("    <loc>{}</loc>", escape_xml(&format!("{site_url}{path}"))),
    ];
    if let Some(lm) = lastmod {
        lines.push(format!(
            "    <lastmod>{}</lastmod>",
            lm.to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
                .replace("+00:00", "Z")
        ));
    }
    lines.push(format!("    <changefreq>{changefreq}</changefreq>"));
    lines.push(format!("    <priority>{:.1}</priority>", priority));
    for lang in LANGS {
        let hl = match lang {
            "pt" => "pt-BR",
            "zh" => "zh-CN",
            other => other,
        };
        lines.push(format!(
            r#"    <xhtml:link rel="alternate" hreflang="{}" href="{}" />"#,
            hl,
            escape_xml(&format!("{site_url}{}", localized_path(lang, base_path)))
        ));
    }
    lines.push(format!(
        r#"    <xhtml:link rel="alternate" hreflang="x-default" href="{}" />"#,
        escape_xml(&format!("{site_url}{base_path}"))
    ));
    lines.push("  </url>".into());
    lines.join("\n")
}

fn localized_path(lang: &str, path: &str) -> String {
    if path == "/" {
        format!("/{lang}")
    } else {
        format!("/{lang}{path}")
    }
}

fn absolute_url(value: &str, site_url: &str) -> String {
    if value.starts_with("http://") || value.starts_with("https://") {
        value.to_string()
    } else {
        format!(
            "{}/{}",
            site_url,
            value.trim_start_matches('/')
        )
    }
}

fn urlencoding_encode(s: &str) -> String {
    // encodeURIComponent-ish for product ids (alphanumeric + hyphen mostly)
    let mut out = String::new();
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char)
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

fn escape_xml(value: &str) -> String {
    sanitize(value)
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn sanitize(value: &str) -> String {
    value
        .split(|c: char| c == '\t' || c == '\r' || c == '\n')
        .collect::<Vec<_>>()
        .join(" ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn csv(value: &str) -> String {
    format!("\"{}\"", sanitize(value).replace('"', "\"\""))
}
