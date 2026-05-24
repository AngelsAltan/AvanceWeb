import os
from flask import Flask, send_from_directory
from config import Config
from extensions import db, cors, jwt
from routes.auth import auth_bp
from routes.contact import contact_bp
from routes.envios import envios_bp
from routes.admin import admin_bp


def create_app():
    app = Flask(__name__, static_folder="static", static_url_path="")
    app.config.from_object(Config)

    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    jwt.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(contact_bp, url_prefix="/api/contact")
    app.register_blueprint(envios_bp, url_prefix="/api/envios")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    with app.app_context():
        db.create_all()
        _seed_admin()
        _seed_demo_client()

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve(path):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")

    return app


def _seed_admin():
    from models import User
    from werkzeug.security import generate_password_hash

    if not User.query.filter_by(correo="admin@skyship.com").first():
        admin = User(
            nombre="Administrador",
            correo="admin@skyship.com",
            telefono="00000000",
            direccion="SkyShip HQ",
            password_hash=generate_password_hash("Admin123456"),
            rol="admin",
        )
        db.session.add(admin)
        db.session.commit()


def _seed_demo_client():
    from models import User
    from werkzeug.security import generate_password_hash

    if not User.query.filter_by(correo="cliente@skyship.com").first():
        cliente = User(
            nombre="Cliente Demo",
            correo="cliente@skyship.com",
            telefono="55555555",
            direccion="Zona 10, Ciudad de Guatemala",
            password_hash=generate_password_hash("Cliente123!"),
            rol="cliente",
        )
        db.session.add(cliente)
        db.session.commit()


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
