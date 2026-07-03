import json
import os

db_path = r"c:\Users\USER\Desktop\Agency Website\database.json"

if os.path.exists(db_path):
    with open(db_path, "r", encoding="utf-8") as f:
        db = json.load(f)
else:
    db = {}

db["websiteContent"] = {
    "Homepage": {
        "hero": {
            "title": "Crafting Functional Luxury for the Modern Web",
            "subtitle": "We engineer high-end digital experiences that sit at the intersection of stunning aesthetics and enterprise-level reliability.",
            "ctaText": "Start Your Project",
            "active": True
        },
        "services": {
            "title": "Our Core Services",
            "subtitle": "Comprehensive digital solutions built to drive enterprise growth.",
            "active": True
        },
        "testimonials": {
            "title": "Client Testimonials",
            "subtitle": "What our clients say about us",
            "active": True,
            "reviews": [
                { "author": "Sarah Jenkins", "company": "IndieShop Co.", "text": "Absolutely stunning work. The design exceeded all our expectations." },
                { "author": "Marcus Lee", "company": "LocalBiz", "text": "The performance is incredible. Our conversion rate increased by 40%." }
            ]
        },
        "stats": {
            "title": "Statistics Counter",
            "active": True,
            "items": [
                { "label": "Projects Completed", "value": "150+" },
                { "label": "Happy Clients", "value": "99%" },
                { "label": "Retention Rate", "value": "95%" }
            ]
        },
        "ctaBanner": {
            "title": "Ready to scale your digital presence?",
            "subtitle": "Get in touch with our experts today and start your journey.",
            "ctaText": "Start Your Project",
            "active": True
        }
    },
    "About Us": {
        "hero": {
            "title": "Architects of the Digital Frontier",
            "subtitle": "We are a team of engineers, designers, and thinkers dedicated to visual excellence.",
            "active": True
        },
        "story": {
            "title": "Our Story",
            "text": "Founded in 2024, Lumina was born from a desire to combine luxury visual design with ultra-fast web infrastructure. We believe that software should be both a utility and a work of art.",
            "active": True
        },
        "values": {
            "title": "Core Values",
            "active": True,
            "items": [
                { "title": "Precision", "desc": "Every pixel and line of code is written with absolute intent." },
                { "title": "Aesthetics", "desc": "Stunning visuals that leave a lasting impression of quality." },
                { "title": "Performance", "desc": "Optimized execution times for sub-millisecond response." }
            ]
        }
    },
    "Services": {
        "hero": {
            "title": "Our Services",
            "subtitle": "Comprehensive digital solutions engineered for modern enterprises. We craft precision-driven experiences that elevate your brand.",
            "active": True
        },
        "features": {
            "title": "Core Offerings",
            "active": True,
            "items": [
                { "title": "Web Design", "desc": "Immersive, user-centric interfaces designed with pixel-perfect precision and functional luxury." },
                { "title": "Web Engineering", "desc": "Robust, scalable, and high-performance digital architectures built on modern technology stacks." },
                { "title": "SEO & Growth", "desc": "Data-driven search engine optimization to maximize your organic visibility and drive targeted traffic." },
                { "title": "Digital Marketing", "desc": "Strategic campaigns that engage your audience and drive measurable conversions across channels." }
            ]
        }
    },
    "Portfolio": {
        "hero": {
            "title": "Featured Work",
            "subtitle": "A curated collection of design systems, web platforms, and brand strategies crafted for industry leaders.",
            "active": True
        },
        "showcase": {
            "title": "Projects Showcase",
            "subtitle": "Explore our creative engineering feats.",
            "active": True
        }
    },
    "Pricing": {
        "hero": {
            "title": "Transparent Pricing",
            "subtitle": "Simple, value-driven plans customized to fit your growth stage.",
            "active": True
        },
        "packages": {
            "title": "Flexible Packages",
            "active": True,
            "items": [
                { "name": "Startup Core", "price": "$3,200", "desc": "Perfect for emerging brands needing a high-performance landing page." },
                { "name": "Enterprise Growth", "price": "$12,000", "desc": "Complete custom Next.js site, CMS integration, and SEO launch." }
            ]
        }
    },
    "Contact": {
        "hero": {
            "title": "Get in Touch",
            "subtitle": "Have a project in mind? Let's build something extraordinary together.",
            "active": True
        },
        "form": {
            "title": "Project Inquiry",
            "subtitle": "Tell us about your objectives and budget.",
            "active": True
        }
    },
    "Blog": {
        "hero": {
            "title": "Digital Insights",
            "subtitle": "Articles and thoughts on design systems, web performance, and search visibility.",
            "active": True
        }
    }
}

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(db, f, indent=2)

print("database.json updated with websiteContent successfully.")
