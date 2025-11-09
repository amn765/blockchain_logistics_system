#!/bin/bash

ORG=
PACKAGE_ID=

case  in
    Manufacturer)
        CONTAINER=peer0.manufacturer.supplychain.com
        ;;
    Logistics) 
        CONTAINER=peer0.logistics.supplychain.com
        ;;
    Retailer)
        CONTAINER=peer0.retailer.supplychain.com
        ;;
    *)
        echo 
