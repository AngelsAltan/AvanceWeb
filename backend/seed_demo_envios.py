"""
Script de un solo uso para inyectar envíos de demostración en meses anteriores,
de modo que el gráfico "Envíos por mes" del panel admin se vea poblado.

Uso:  python seed_demo_envios.py
Se conecta a la misma base de datos definida en backend/.env (RDS en producción).
Es idempotente: si el cliente demo ya tiene >= 10 envíos, no inserta nada.
"""
import random
import string
from datetime import datetime

from app import create_app
from extensions import db
from models import User, Shipment


# (año, mes, día, destino "Ciudad, País", peso, servicio, estado, costo)
DEMO = [
    (2025, 8,  12, "Guatemala, Guatemala",        3.5,  "standard", "entregado",    213.00),
    (2025, 9,  5,  "San Salvador, El Salvador",   8.0,  "express",  "entregado",    441.00),
    (2025, 10, 20, "Tegucigalpa, Honduras",       2.0,  "standard", "entregado",    186.00),
    (2025, 11, 15, "Ciudad de Mexico, Mexico",    12.5, "express",  "entregado",    562.50),
    (2025, 12, 3,  "Bogota, Colombia",            5.0,  "standard", "entregado",    240.00),
    (2026, 1,  18, "Lima, Peru",                  7.5,  "express",  "en_tránsito",  427.50),
    (2026, 2,  22, "Quito, Ecuador",              4.0,  "standard", "en_tránsito",  222.00),
    (2026, 3,  10, "Panama, Panama",              9.0,  "express",  "entregado",    468.00),
    (2026, 4,  7,  "San Jose, Costa Rica",        6.0,  "standard", "pendiente",    258.00),
    (2026, 5,  2,  "Managua, Nicaragua",          10.0, "express",  "pendiente",    495.00),
]


def _codigo_unico():
    while True:
        codigo = f"SKY-{''.join(random.choices(string.ascii_uppercase, k=3))}" \
                 f"{''.join(random.choices(string.digits, k=6))}"
        if not Shipment.query.filter_by(codigo_guia=codigo).first():
            return codigo


def main():
    app = create_app()
    with app.app_context():
        cliente = User.query.filter_by(correo="cliente@skyship.com").first()
        if not cliente:
            cliente = User.query.filter_by(rol="cliente").first()
        if not cliente:
            print("No hay ningún cliente al cual asignar los envíos. Aborta.")
            return

        existentes = Shipment.query.filter_by(usuario_id=cliente.id).count()
        if existentes >= 10:
            print(f"El cliente '{cliente.correo}' ya tiene {existentes} envios. No se inserta nada.")
        else:
            creados = 0
            for (y, m, d, destino, peso, servicio, estado, costo) in DEMO:
                envio = Shipment(
                    codigo_guia=_codigo_unico(),
                    usuario_id=cliente.id,
                    destino=destino,
                    peso=peso,
                    tipo_servicio=servicio,
                    estado=estado,
                    costo_estimado=costo,
                    creado_en=datetime(y, m, d, 12, 0, 0),
                )
                db.session.add(envio)
                creados += 1
            db.session.commit()
            print(f"[OK] {creados} envios de demostracion insertados para '{cliente.correo}'.")

        # Resumen por mes
        from sqlalchemy import func, extract
        por_mes = (
            db.session.query(
                extract("year", Shipment.creado_en).label("anio"),
                extract("month", Shipment.creado_en).label("mes"),
                func.count(Shipment.id).label("total"),
            )
            .group_by("anio", "mes")
            .order_by("anio", "mes")
            .all()
        )
        print("Envios por mes en la BD:")
        for r in por_mes:
            print(f"  {int(r.anio)}-{int(r.mes):02d}: {r.total}")


if __name__ == "__main__":
    main()
