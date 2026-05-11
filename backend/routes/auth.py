from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    required = ["nombre", "correo", "password"]
    if not all(k in data for k in required):
        return jsonify({"error": "Faltan campos requeridos"}), 400

    if User.query.filter_by(correo=data["correo"]).first():
        return jsonify({"error": "El correo ya está registrado"}), 409

    user = User(
        nombre=data["nombre"],
        correo=data["correo"],
        telefono=data.get("telefono", ""),
        direccion=data.get("direccion", ""),
        password_hash=generate_password_hash(data["password"]),
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "usuario": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(correo=data.get("correo")).first()
    if not user or not check_password_hash(user.password_hash, data.get("password", "")):
        return jsonify({"error": "Credenciales incorrectas"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "usuario": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(user.to_dict()), 200
