from flask import Blueprint, request, jsonify
from extensions import db
from models import Contact

contact_bp = Blueprint("contact", __name__)


@contact_bp.route("", methods=["POST"])
def create_contact():
    data = request.get_json()
    required = ["nombre", "correo", "mensaje"]
    if not all(k in data for k in required):
        return jsonify({"error": "Faltan campos requeridos"}), 400

    contact = Contact(
        nombre=data["nombre"],
        correo=data["correo"],
        telefono=data.get("telefono", ""),
        mensaje=data["mensaje"],
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify({"mensaje": "Mensaje enviado correctamente"}), 201
