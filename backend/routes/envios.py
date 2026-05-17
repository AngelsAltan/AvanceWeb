import random
import string
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Shipment

envios_bp = Blueprint("envios", __name__)

COSTO_BASE = 150
COSTO_POR_LIBRA = 18
FACTOR_EXPRESS = 1.5


def _generar_codigo():
    sufijo = "".join(random.choices(string.digits, k=6))
    return f"SKY-{''.join(random.choices(string.ascii_uppercase, k=3))}{sufijo}"


def _calcular_costo(peso, tipo_servicio):
    costo = COSTO_BASE + peso * COSTO_POR_LIBRA
    if tipo_servicio == "express":
        costo *= FACTOR_EXPRESS
    return round(costo, 2)


@envios_bp.route("", methods=["GET"])
@jwt_required()
def get_envios():
    user_id = int(get_jwt_identity())
    envios = Shipment.query.filter_by(usuario_id=user_id).order_by(Shipment.creado_en.desc()).all()
    return jsonify([e.to_dict() for e in envios]), 200


@envios_bp.route("", methods=["POST"])
@jwt_required()
def create_envio():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    required = ["destino", "peso", "tipo_servicio"]
    if not all(k in data for k in required):
        return jsonify({"error": "Faltan campos requeridos"}), 400

    if data["tipo_servicio"] not in ("standard", "express"):
        return jsonify({"error": "tipo_servicio debe ser standard o express"}), 400

    codigo = _generar_codigo()
    while Shipment.query.filter_by(codigo_guia=codigo).first():
        codigo = _generar_codigo()

    # Si el frontend ya calculó el costo (con extras/ruta), lo usa directamente
    if "costo_estimado" in data:
        costo = float(data["costo_estimado"])
    else:
        costo = _calcular_costo(float(data["peso"]), data["tipo_servicio"])

    envio = Shipment(
        codigo_guia=codigo,
        usuario_id=user_id,
        destino=data["destino"],
        peso=float(data["peso"]),
        tipo_servicio=data["tipo_servicio"],
        costo_estimado=costo,
    )
    db.session.add(envio)
    db.session.commit()
    return jsonify(envio.to_dict()), 201
