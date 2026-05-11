from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from sqlalchemy import func, extract
from extensions import db
from models import User, Shipment

admin_bp = Blueprint("admin", __name__)


def _require_admin():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.rol != "admin":
        return None, (jsonify({"error": "Acceso denegado"}), 403)
    return user, None


# ── Métricas ──────────────────────────────────────────────────────────────────

@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def stats():
    _, err = _require_admin()
    if err:
        return err

    total_usuarios = User.query.filter_by(rol="cliente").count()
    total_envios = Shipment.query.count()
    ingresos = db.session.query(func.sum(Shipment.costo_estimado)).scalar() or 0

    # Envíos por mes (últimos 12 meses)
    por_mes = (
        db.session.query(
            extract("year", Shipment.creado_en).label("anio"),
            extract("month", Shipment.creado_en).label("mes"),
            func.count(Shipment.id).label("total"),
        )
        .group_by("anio", "mes")
        .order_by("anio", "mes")
        .limit(12)
        .all()
    )

    # Envíos por estado
    por_estado = (
        db.session.query(Shipment.estado, func.count(Shipment.id))
        .group_by(Shipment.estado)
        .all()
    )

    # Envíos por servicio
    por_servicio = (
        db.session.query(Shipment.tipo_servicio, func.count(Shipment.id))
        .group_by(Shipment.tipo_servicio)
        .all()
    )

    return jsonify({
        "total_usuarios": total_usuarios,
        "total_envios": total_envios,
        "ingresos_totales": round(float(ingresos), 2),
        "por_mes": [{"anio": int(r.anio), "mes": int(r.mes), "total": r.total} for r in por_mes],
        "por_estado": {r[0]: r[1] for r in por_estado},
        "por_servicio": {r[0]: r[1] for r in por_servicio},
    }), 200


# ── CRUD Usuarios ─────────────────────────────────────────────────────────────

@admin_bp.route("/usuarios", methods=["GET"])
@jwt_required()
def get_usuarios():
    _, err = _require_admin()
    if err:
        return err
    usuarios = User.query.order_by(User.creado_en.desc()).all()
    return jsonify([u.to_dict() for u in usuarios]), 200


@admin_bp.route("/usuarios/<int:uid>", methods=["PUT"])
@jwt_required()
def update_usuario(uid):
    _, err = _require_admin()
    if err:
        return err
    user = User.query.get_or_404(uid)
    data = request.get_json()
    for field in ("nombre", "correo", "telefono", "direccion", "rol"):
        if field in data:
            setattr(user, field, data[field])
    if "password" in data and data["password"]:
        user.password_hash = generate_password_hash(data["password"])
    db.session.commit()
    return jsonify(user.to_dict()), 200


@admin_bp.route("/usuarios/<int:uid>", methods=["DELETE"])
@jwt_required()
def delete_usuario(uid):
    _, err = _require_admin()
    if err:
        return err
    user = User.query.get_or_404(uid)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"mensaje": "Usuario eliminado"}), 200


# ── CRUD Envíos ───────────────────────────────────────────────────────────────

@admin_bp.route("/envios", methods=["GET"])
@jwt_required()
def get_envios():
    _, err = _require_admin()
    if err:
        return err
    envios = Shipment.query.order_by(Shipment.creado_en.desc()).all()
    result = []
    for e in envios:
        d = e.to_dict()
        d["usuario_nombre"] = e.usuario.nombre if e.usuario else "—"
        result.append(d)
    return jsonify(result), 200


@admin_bp.route("/envios/<int:eid>", methods=["PUT"])
@jwt_required()
def update_envio(eid):
    _, err = _require_admin()
    if err:
        return err
    envio = Shipment.query.get_or_404(eid)
    data = request.get_json()
    for field in ("destino", "peso", "tipo_servicio", "estado", "costo_estimado"):
        if field in data:
            setattr(envio, field, data[field])
    db.session.commit()
    return jsonify(envio.to_dict()), 200


@admin_bp.route("/envios/<int:eid>", methods=["DELETE"])
@jwt_required()
def delete_envio(eid):
    _, err = _require_admin()
    if err:
        return err
    envio = Shipment.query.get_or_404(eid)
    db.session.delete(envio)
    db.session.commit()
    return jsonify({"mensaje": "Envío eliminado"}), 200
