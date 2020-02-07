import * as Yup from 'yup';

import { Op } from 'sequelize';
import Delivery from '../models/Delivery';
import File from '../models/File';
import DeliveryMan from '../models/DeliveryMan';
import Recipient from '../models/Recipient';
import DeliveryProblem from '../models/DeliveryProblem';

class DeliveryController {
  async store(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha na validação dos campos' });
    }

    const delivery = await Delivery.create(req.body);

    return res.json({
      delivery,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string(),
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
      signature_id: Yup.number(),
      start_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha na validação dos campos' });
    }

    const { id } = req.params;

    const delivery = await Delivery.findByPk(id);

    if (!delivery) {
      return res
        .status(400)
        .json({ error: 'Id da encomenda enviado é inválido' });
    }

    if (delivery.canceled_at) {
      return res.status(400).json({ error: 'Encomenda está cancelada' });
    }

    const deliveryRes = await delivery.update(req.body);

    return res.json({
      deliveryRes,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id);

    if (!delivery) {
      return res
        .status(400)
        .json({ error: 'Id da encomenda enviado é inválido' });
    }

    if (delivery.canceled_at) {
      return res.status(400).json({ error: 'Encomenda já está cancelada' });
    }

    delivery.canceled_at = new Date();

    await delivery.save();

    return res.json({
      message: 'Encomenda cancelada com sucesso',
    });
  }

  async index(req, res) {
    const { page = 1 } = req.query;

    const deliverys = await Delivery.findAll({
      where: {
        canceled_at: null,
      },
      delivery: [['created_at', 'DESC']],
      attributes: ['id', 'product', 'start_date', 'end_date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path'],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'street',
            'number',
            'complement',
            'state',
            'city',
            'zipcode',
          ],
        },
        {
          model: DeliveryMan,
          as: 'deliveryman',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (deliverys.length < 1) {
      return res
        .status(400)
        .json({ error: 'Não foi encontrado nenhuma encomenda' });
    }

    return res.json({
      deliverys,
    });
  }

  async indexProblem(req, res) {
    const { page = 1 } = req.query;

    const deliverys = await Delivery.findAll({
      where: {
        start_date: {
          [Op.ne]: null,
        },
        canceled_at: null,
        end_date: null,
      },
      attributes: ['id', 'product', 'start_date', 'end_date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [DeliveryProblem],
    });

    if (deliverys.length < 1) {
      return res
        .status(400)
        .json({ error: 'Não foi encontrado nenhuma encomenda com problema' });
    }

    const deliverysRes = deliverys.filter(
      delivery => delivery.DeliveryProblems.length > 0
    );

    if (deliverysRes.length < 1) {
      return res
        .status(400)
        .json({ error: 'Não foi encontrado nenhuma encomenda com problema' });
    }

    return res.json({
      deliverysRes,
    });
  }

  async indexByIdProblem(req, res) {
    const { id } = req.params;
    const { page = 1 } = req.query;

    const delivery = await Delivery.findByPk(id, {
      include: { model: DeliveryProblem, limit: 10, offset: (page - 1) * 10 },
    });

    if (!delivery) {
      return res
        .status(400)
        .json({ error: 'Id da encomenda enviado é inválido' });
    }

    if (delivery.DeliveryProblems.length > 0) {
      return res
        .status(400)
        .json({ error: 'Não foi encontrado nenhum problema na encomenda' });
    }

    return res.json({
      delivery,
    });
  }
}

export default new DeliveryController();
