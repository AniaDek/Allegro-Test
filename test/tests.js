import supertest from 'supertest';
import fs from 'fs';
import { expect } from 'chai';

let authToken;
let apiRequest;


before(async () => {
  let settingsData = fs.readFileSync('Allegro-credentials.json');
  let settings = JSON.parse(settingsData);
  const authRequest = supertest(settings.authUrl);
  const authHeader = 'Basic ' + Buffer.from(settings.clientID + ':' + settings.clientsecret).toString('base64');
  // make a GET call to the users api
  const authResponse = await authRequest.get('token?grant_type=client_credentials')
    .set('Authorization', authHeader).send();

  apiRequest = supertest(settings.apiUrl);
  
  authToken = 'Bearer ' + authResponse.body.access_token;
})

describe('Category List', async () => {
  it('GET /sale/categories should return all main categories', async () => {
    let response = await apiRequest.get('sale/categories')
      .set('Authorization', authToken)
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
      expect(response.status).be.equal(200);
      expect(response.body.categories.length > 0).be.true;
      expect(response.body.categories[0].name).be.not.empty;
      
  });

  it('GET /sale/categories non leaf category returns child categories', async () => {
    let mainCategoriesResponse = await apiRequest.get('sale/categories')
      .set('Authorization', authToken)
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
    let categoryWithChildren;
    for (var i = 0; i <= mainCategoriesResponse.body.categories.length; i++) {
      let category = mainCategoriesResponse.body.categories[i];
      if (category.leaf == false) {
        categoryWithChildren = category;
        break;
      }
    }

    let childCategoriesResponse = await apiRequest.get('sale/categories?parent.id=' + categoryWithChildren.id)
      .set('Authorization', authToken)
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
    expect(childCategoriesResponse.body.categories.length > 0).be.true;
    let childCategories=childCategoriesResponse.body.categories;
    for( let i=0; i<=childCategories.length-1; i++ ){
      let childCategory=childCategories[i];
      expect(childCategory.parent.id==categoryWithChildren.id).to.be.true;
    }
    

  });

  it('GET /sale/categories for non existing parent should return error',async () => {
    let response = await apiRequest.get('sale/categories?parent.id=0')
      .set('Authorization', authToken)
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
      expect(response.status).be.equal(404);
      expect(response.body.errors.length > 0).to.be.true; 
      
  });

  it('GET /sale/categories without access token 401 is returned', async () => {
    let response = await apiRequest.get('sale/categories')
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
      expect(response.status).be.equal(401);
     
  });

  it('GET /sale/categories even with incorrect content-type proper response is returned', async () => {
    let response = await apiRequest.get('sale/categories')
      .set('Authorization', authToken)
      .set('Content-Type', 'incorrect')
      .send();
      expect(response.status).be.equal(200);
      expect(response.body.categories.length > 0).be.true;

  });
});




describe('Category by ID', async () => {
  it('GET /sale/categories/{categoryId} for non existng category returns 404', async () => {
    let response = await apiRequest.get('sale/categories/0')
      .set('Authorization', authToken)
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
      expect(response.status).be.equal(404); 
      expect(response.body.errors.length > 0).to.be.true; 
  });

  it('GET /sale/categories/{categoryId} without access-Token returns 401', async () => {
    let response = await apiRequest.get('sale/categories/0')
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
      expect(response.status).be.equal(401); 
      
  });

  it('GET /sale/categories/{categoryId} for category ID that is too large for integer returns 404', async () => {
    let response = await apiRequest.get('sale/categories/100000000000000000000')
      .set('Authorization', authToken)
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
      expect(response.status).be.equal(404);
      expect(response.body.errors.length > 0).to.be.true; 
  });

  it('GET /sale/categories/{categoryId} for existng category returns proper response', async () => {
    let mainCategoriesResponse = await apiRequest.get('sale/categories')
    .set('Authorization', authToken)
    .set('Content-Type', 'application/vnd.allegro.public.v1+json')
    .send();
    let existingCategoryID = mainCategoriesResponse.body.categories[0].id;
    let response = await apiRequest.get('sale/categories/'+existingCategoryID)
      .set('Authorization', authToken)
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
      expect(response.status).be.equal(200);
      let category = response.body;
      expect(response.body).to.be.not.null;
      expect(category.id==existingCategoryID).be.true; 
  });

});




describe('Category Params', async () => {
  it('GET /sale/categories/{categoryId}/parameters for non existing category returns 404', async () => {
    let response = await apiRequest.get('sale/categories/0/parameters')
      .set('Authorization', authToken)
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
      expect(response.status).be.equal(404);
  
  });

  it('GET /sale/categories/{categoryId}/parameters without access-Token returns 401', async () => {
    let response = await apiRequest.get('sale/categories/0/parameters')
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
      expect(response.status).be.equal(401);

});

it('GET /sale/categories/{categoryId}/parameters for existing category object parameters length !0 and returns 200', async () => {
  let mainCategoriesResponse = await apiRequest.get('sale/categories')
    .set('Authorization', authToken)
    .set('Content-Type', 'application/vnd.allegro.public.v1+json')
    .send();
    let existingCategoryID = mainCategoriesResponse.body.categories[0].id;
    let response = await apiRequest.get('sale/categories/' + existingCategoryID + '/parameters')
      .set('Authorization', authToken)
      .set('Content-Type', 'application/vnd.allegro.public.v1+json')
      .send();
    expect(response.status).be.equal(200);
    expect(response.body.parameters.length>0).to.be.true;
   

});

});